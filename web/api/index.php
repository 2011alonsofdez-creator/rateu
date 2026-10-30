<?php
// index.php — el servidor de Datafactura.
// Cuentas, sesiones, créditos y la llamada a la IA. Todo lo que no se puede
// confiar al navegador vive aquí.
//
// Rutas:  ?a=registro | login | logout | yo | usar | checkout | cancelar | webhook
declare(strict_types=1);

require_once __DIR__ . '/gemini.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// ---------------------------------------------------------------- planes
const PLANES = [
  'gratis'  => ['nombre' => 'Gratis',  'creditos' => 5,    'precio' => 0],
  'pro'     => ['nombre' => 'Pro',     'creditos' => 200,  'precio' => 19],
  'empresa' => ['nombre' => 'Empresa', 'creditos' => 1000, 'precio' => 59],
];
const COSTE_DOCUMENTO = 1;
const MAX_BYTES       = 12 * 1024 * 1024;   // 12 MB por documento

// ---------------------------------------------------------------- utilidades
function salir(array $datos, int $code = 200): void {
  http_response_code($code);
  echo json_encode($datos, JSON_UNESCAPED_UNICODE);
  exit;
}
function error_humano(string $mensaje, int $code = 400, array $extra = []): void {
  salir(array_merge(['ok' => false, 'error' => $mensaje], $extra), $code);
}
function cuerpo(): array {
  $raw = file_get_contents('php://input');
  $d = json_decode((string) $raw, true);
  return is_array($d) ? $d : [];
}

// ---------------------------------------------------------------- base de datos
// ⚠️ Vive FUERA de public_html: al publicar una versión nueva de la web se
// reemplaza la carpeta pública entera, y con la base de datos dentro se
// perderían todas las cuentas.
function ruta_db(): string {
  $fuera = dirname(dirname(__DIR__)) . '/datafactura_datos';
  if (is_dir($fuera) || @mkdir($fuera, 0750, true)) {
    if (is_writable($fuera)) return $fuera . '/usuarios.json';
  }
  $dentro = __DIR__ . '/../datos';
  if (!is_dir($dentro)) @mkdir($dentro, 0750, true);
  return $dentro . '/usuarios.json';
}
function db_leer(): array {
  $f = ruta_db();
  if (!is_file($f)) return ['usuarios' => [], 'sesiones' => []];
  $d = json_decode((string) @file_get_contents($f), true);
  if (!is_array($d)) $d = [];
  $d['usuarios'] = $d['usuarios'] ?? [];
  $d['sesiones'] = $d['sesiones'] ?? [];
  return $d;
}
// Lee, modifica y escribe con bloqueo exclusivo: dos peticiones a la vez nunca
// se pisan los créditos.
function db_transaccion(callable $fn) {
  $f = ruta_db();
  $lock = fopen($f . '.lock', 'c');
  if ($lock) flock($lock, LOCK_EX);
  try {
    $db = db_leer();
    $res = $fn($db);
    @file_put_contents($f, json_encode($db, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    return $res;
  } finally {
    if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
  }
}

// ---------------------------------------------------------------- sesiones
function cookie_segura(): bool {
  return (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}
function poner_cookie(string $token): void {
  setcookie('df_sesion', $token, [
    'expires'  => time() + 60 * 60 * 24 * 30,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => cookie_segura(),
  ]);
}
function borrar_cookie(): void {
  setcookie('df_sesion', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => cookie_segura()]);
}
function email_de_sesion(array $db): string {
  $t = $_COOKIE['df_sesion'] ?? '';
  if ($t === '') return '';
  $s = $db['sesiones'][$t] ?? null;
  if (!$s) return '';
  if (strtotime($s['expira']) < time()) return '';
  return (string) $s['email'];
}
function exige_sesion(array $db): string {
  $email = email_de_sesion($db);
  if ($email === '' || !isset($db['usuarios'][$email])) {
    error_humano('Tu sesión ha caducado. Vuelve a entrar.', 401);
  }
  return $email;
}

// ---------------------------------------------------------------- renovación mensual
// En modo demo hace lo mismo que hará el aviso de la pasarela real: si la fecha
// de renovación ya pasó y el plan es de pago, recarga los créditos del mes.
function renovar_si_toca(array &$u): void {
  if (($u['plan'] ?? 'gratis') === 'gratis') return;
  if (empty($u['renovacion']) || strtotime($u['renovacion']) > time()) return;
  $u['creditos'] = PLANES[$u['plan']]['creditos'];
  $u['renovacion'] = date('Y-m-d', strtotime('+30 days'));
  $u['historial'][] = ['fecha' => gmdate('c'), 'accion' => 'renovacion', 'detalle' => 'Recarga mensual del plan ' . PLANES[$u['plan']]['nombre'], 'coste' => 0];
}
function perfil(array $u, string $email): array {
  return [
    'email'      => $email,
    'plan'       => $u['plan'],
    'plan_nombre'=> PLANES[$u['plan']]['nombre'],
    'creditos'   => (int) $u['creditos'],
    'renovacion' => $u['renovacion'] ?? null,
    'creado'     => $u['creado'] ?? null,
    'historial'  => array_slice(array_reverse($u['historial'] ?? []), 0, 50),
    'ia_activa'  => ia_hay_clave(),
  ];
}

// ---------------------------------------------------------------- límite de intentos de login
function login_bloqueado(): bool {
  $f = sys_get_temp_dir() . '/df_login_' . md5($_SERVER['REMOTE_ADDR'] ?? '0');
  $t = is_file($f) ? json_decode((string) @file_get_contents($f), true) : [];
  if (!is_array($t)) $t = [];
  $t = array_filter($t, fn($x) => $x > time() - 900);
  return count($t) >= 5;
}
function login_fallido(): void {
  $f = sys_get_temp_dir() . '/df_login_' . md5($_SERVER['REMOTE_ADDR'] ?? '0');
  $t = is_file($f) ? json_decode((string) @file_get_contents($f), true) : [];
  if (!is_array($t)) $t = [];
  $t[] = time();
  @file_put_contents($f, json_encode(array_slice($t, -20)), LOCK_EX);
}

// ---------------------------------------------------------------- normalización de importes
function num_o_null($v) {
  if ($v === null || $v === '' || is_bool($v)) return null;
  if (is_int($v) || is_float($v)) return round((float) $v, 2);
  $s = trim((string) $v);
  $s = str_replace([' ', '€', '$', "\xc2\xa0"], '', $s);
  // 1.234,56 -> 1234.56   ·   1,234.56 -> 1234.56
  if (preg_match('/,\d{1,2}$/', $s)) $s = str_replace('.', '', $s);
  $s = str_replace(',', '.', $s);
  if (!is_numeric($s)) return null;
  return round((float) $s, 2);
}
function texto_o_null($v) {
  if (!is_string($v)) return null;
  $v = trim($v);
  return $v === '' ? null : mb_substr($v, 0, 300);
}

// ---------------------------------------------------------------- la IA
const CAMPOS = ['emisor_nombre','emisor_nif','cliente_nombre','cliente_nif','numero_factura','fecha',
                'base_imponible','iva_porcentaje','iva_cuota','irpf_porcentaje','irpf_cuota','total',
                'moneda','forma_pago','concepto'];
const CAMPOS_NUM = ['base_imponible','iva_porcentaje','iva_cuota','irpf_porcentaje','irpf_cuota','total'];

function sistema_extraccion(): string {
  return 'Eres un experto en contabilidad española que lee facturas y tickets de gasto '
       . 'y extrae sus datos con exactitud literal. Devuelves únicamente JSON válido.';
}
function prompt_extraccion(): string {
  return <<<TXT
Lee el documento (una factura, un ticket o un recibo) y extrae sus datos.

Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto alrededor y sin ```, con EXACTAMENTE estas claves:

{
  "emisor_nombre": string|null,     // quien emite la factura (la tienda, el proveedor)
  "emisor_nif": string|null,        // NIF/CIF del emisor
  "cliente_nombre": string|null,    // a quién va dirigida
  "cliente_nif": string|null,
  "numero_factura": string|null,
  "fecha": string|null,             // fecha de emisión en formato AAAA-MM-DD
  "base_imponible": number|null,
  "iva_porcentaje": number|null,    // 21, 10, 4, 0...
  "iva_cuota": number|null,         // importe del IVA
  "irpf_porcentaje": number|null,   // retención, solo si aparece
  "irpf_cuota": number|null,        // importe retenido (positivo)
  "total": number|null,             // importe final a pagar
  "moneda": string|null,            // EUR por defecto
  "forma_pago": string|null,        // "Efectivo", "Tarjeta", "Transferencia", "Domiciliación"...
  "concepto": string|null,          // descripción corta de lo comprado (máx. 120 caracteres)
  "confianza": { "<campo>": number },  // 0 a 1 por CADA campo anterior que hayas rellenado
  "origen":    { "<campo>": string }   // fragmento LITERAL del documento del que sale cada dato
}

Reglas:
- Usa PUNTO como separador decimal. Sin símbolos de moneda dentro de los números.
- Si un dato no aparece en el documento, pon null. NO lo inventes ni lo deduzcas.
- "origen" debe ser el texto copiado CARÁCTER A CARÁCTER del documento (por ejemplo "TOTAL 24,20 €"),
  porque se buscará en el documento para señalar de dónde sale cada dato. Copia el fragmento corto
  que contiene el valor, no toda la línea si es muy larga.
- "confianza": 1 si lo lees con total claridad; por debajo de 0.7 si está borroso, cortado, torcido
  o lo has tenido que interpretar. Sé honesto: es lo que decide qué revisa la persona primero.
- Si es un ticket simple sin cliente, deja cliente_nombre y cliente_nif a null.
- Si solo aparece el total y el IVA incluido, calcula base e IVA solo si el documento indica el tipo;
  si no, deja null.
- El IRPF es una retención: solo si el documento la menciona explícitamente.
TXT;
}

function extraer_documento(string $b64, string $mime): array {
  $sys = sistema_extraccion();
  $prompt = prompt_extraccion();
  $r = ia_vision($sys, $prompt, $b64, $mime, 2000);
  if (!$r['ok']) return ['ok' => false, 'motivo' => $r['motivo']];
  $d = ia_json($r['texto']);
  if ($d === null) return ['ok' => false, 'motivo' => 'json_invalido'];
  return ['ok' => true, 'datos' => $d];
}

// Limpia, normaliza y aplica las comprobaciones aritméticas (en código, no en la IA).
function normalizar(array $d): array {
  $campos = [];
  foreach (CAMPOS as $c) {
    $v = $d[$c] ?? null;
    $campos[$c] = in_array($c, CAMPOS_NUM, true) ? num_o_null($v) : texto_o_null($v);
  }
  if ($campos['moneda'] === null) $campos['moneda'] = 'EUR';
  if ($campos['fecha'] !== null && preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$#', $campos['fecha'], $m)) {
    $anio = strlen($m[3]) === 2 ? '20' . $m[3] : $m[3];
    $campos['fecha'] = sprintf('%04d-%02d-%02d', (int) $anio, (int) $m[2], (int) $m[1]);
  }

  $confianza = [];
  foreach (CAMPOS as $c) {
    $v = $d['confianza'][$c] ?? null;
    $confianza[$c] = is_numeric($v) ? max(0.0, min(1.0, (float) $v)) : ($campos[$c] === null ? 0.0 : 0.8);
  }
  $origen = [];
  foreach (CAMPOS as $c) {
    $t = texto_o_null($d['origen'][$c] ?? null);
    if ($t !== null) $origen[$c] = $t;
  }

  // --- comprobaciones aritméticas ---
  $avisos = [];
  $base = $campos['base_imponible']; $iva = $campos['iva_cuota'];
  $irpf = $campos['irpf_cuota'] ?? 0.0; $total = $campos['total'];
  $descuadre = false;
  if ($base !== null && $iva !== null && $total !== null) {
    $calc = round($base + $iva - (float) $irpf, 2);
    if (abs($calc - $total) > 0.02) {
      $descuadre = true;
      $avisos[] = 'Los números no cuadran: base ' . number_format($base, 2, ',', '.')
                . ' + IVA ' . number_format($iva, 2, ',', '.')
                . ((float) $irpf > 0 ? ' − IRPF ' . number_format((float) $irpf, 2, ',', '.') : '')
                . ' = ' . number_format($calc, 2, ',', '.')
                . ', pero el total dice ' . number_format($total, 2, ',', '.') . '.';
    }
  }
  if ($base !== null && $campos['iva_porcentaje'] !== null && $iva !== null && $base > 0) {
    $esperado = round($base * $campos['iva_porcentaje'] / 100, 2);
    if (abs($esperado - $iva) > max(0.02, $base * 0.005)) {
      $avisos[] = 'La cuota de IVA no coincide con el ' . rtrim(rtrim(number_format($campos['iva_porcentaje'], 2, ',', '.'), '0'), ',') . '% de la base.';
    }
  }
  $faltan = [];
  foreach (['emisor_nombre','emisor_nif','fecha','total'] as $c) if ($campos[$c] === null) $faltan[] = $c;
  if ($faltan) $avisos[] = 'Faltan datos obligatorios que no he sabido leer.';

  $dudosos = [];
  foreach (CAMPOS as $c) if ($campos[$c] !== null && $confianza[$c] < 0.7) $dudosos[] = $c;
  if ($dudosos) $avisos[] = (count($dudosos) === 1 ? 'Hay 1 dato que he leído con dudas.' : 'Hay ' . count($dudosos) . ' datos que he leído con dudas.');

  return [
    'campos'    => $campos,
    'confianza' => $confianza,
    'origen'    => $origen,
    'descuadre' => $descuadre,
    'dudosos'   => $dudosos,
    'faltan'    => $faltan,
    'avisos'    => $avisos,
    'revisar'   => ($descuadre || $dudosos || $faltan) ? true : false,
  ];
}

// ================================================================ rutas
$a = $_GET['a'] ?? '';
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($a === 'estado') {
  salir(['ok' => true, 'ia_activa' => ia_hay_clave(), 'planes' => PLANES]);
}

if ($a === 'registro') {
  if ($metodo !== 'POST') error_humano('Método no permitido', 405);
  $b = cuerpo();
  $email = strtolower(trim((string) ($b['email'] ?? '')));
  $pass  = (string) ($b['password'] ?? '');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error_humano('Ese correo no parece válido.');
  if (strlen($pass) < 8) error_humano('La contraseña necesita al menos 8 caracteres.');

  $res = db_transaccion(function (array &$db) use ($email, $pass) {
    if (isset($db['usuarios'][$email])) return ['dup' => true];
    $db['usuarios'][$email] = [
      'hash'       => password_hash($pass, PASSWORD_BCRYPT),
      'plan'       => 'gratis',
      'creditos'   => PLANES['gratis']['creditos'],
      'renovacion' => null,
      'creado'     => date('Y-m-d'),
      'historial'  => [['fecha' => gmdate('c'), 'accion' => 'alta', 'detalle' => 'Cuenta creada con ' . PLANES['gratis']['creditos'] . ' créditos gratis', 'coste' => 0]],
    ];
    $token = bin2hex(random_bytes(32));
    $db['sesiones'][$token] = ['email' => $email, 'expira' => date('c', time() + 60 * 60 * 24 * 30)];
    return ['token' => $token, 'perfil' => perfil($db['usuarios'][$email], $email)];
  });
  if (!empty($res['dup'])) error_humano('Ya hay una cuenta con ese correo. Entra con tu contraseña.', 409);
  poner_cookie($res['token']);
  salir(['ok' => true, 'perfil' => $res['perfil']]);
}

if ($a === 'login') {
  if ($metodo !== 'POST') error_humano('Método no permitido', 405);
  if (login_bloqueado()) error_humano('Demasiados intentos. Espera unos minutos y vuelve a probar.', 429);
  $b = cuerpo();
  $email = strtolower(trim((string) ($b['email'] ?? '')));
  $pass  = (string) ($b['password'] ?? '');

  $res = db_transaccion(function (array &$db) use ($email, $pass) {
    $u = $db['usuarios'][$email] ?? null;
    if (!$u || !password_verify($pass, $u['hash'])) return null;
    renovar_si_toca($db['usuarios'][$email]);
    $token = bin2hex(random_bytes(32));
    $db['sesiones'][$token] = ['email' => $email, 'expira' => date('c', time() + 60 * 60 * 24 * 30)];
    return ['token' => $token, 'perfil' => perfil($db['usuarios'][$email], $email)];
  });
  if ($res === null) { login_fallido(); error_humano('El correo o la contraseña no son correctos.', 401); }
  poner_cookie($res['token']);
  salir(['ok' => true, 'perfil' => $res['perfil']]);
}

if ($a === 'logout') {
  $t = $_COOKIE['df_sesion'] ?? '';
  if ($t !== '') db_transaccion(function (array &$db) use ($t) { unset($db['sesiones'][$t]); return true; });
  borrar_cookie();
  salir(['ok' => true]);
}

if ($a === 'yo') {
  $res = db_transaccion(function (array &$db) {
    $t = $_COOKIE['df_sesion'] ?? '';
    $s = $db['sesiones'][$t] ?? null;
    if (!$s || strtotime($s['expira']) < time() || !isset($db['usuarios'][$s['email']])) return null;
    renovar_si_toca($db['usuarios'][$s['email']]);
    return perfil($db['usuarios'][$s['email']], $s['email']);
  });
  if ($res === null) salir(['ok' => false, 'invitado' => true], 200);
  salir(['ok' => true, 'perfil' => $res]);
}

if ($a === 'usar') {
  if ($metodo !== 'POST') error_humano('Método no permitido', 405);
  $db = db_leer();
  $email = exige_sesion($db);

  $b = cuerpo();
  $nombre = texto_o_null($b['nombre'] ?? '') ?? 'documento';
  $mime   = (string) ($b['mime'] ?? '');
  $b64    = (string) ($b['datos'] ?? '');
  $permitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!in_array($mime, $permitidos, true)) error_humano('Solo puedo leer PDF, JPG o PNG.');
  if ($b64 === '') error_humano('No me ha llegado el documento. Vuelve a intentarlo.');
  if (strlen($b64) * 3 / 4 > MAX_BYTES) error_humano('Ese archivo pesa más de 12 MB. Comprímelo o hazle una foto con menos resolución.');
  if (!ia_hay_clave()) error_humano('La inteligencia artificial todavía no está activada en esta web. Avisa al administrador.', 503);

  $limite = ia_limites('df');
  if ($limite !== '') error_humano('Vas muy rápido 🙂 Espera unos segundos y sigue.', 429);

  // 1) reservar el crédito ANTES de llamar a la IA
  $reserva = db_transaccion(function (array &$db) use ($email) {
    $u = &$db['usuarios'][$email];
    renovar_si_toca($u);
    if ((int) $u['creditos'] < COSTE_DOCUMENTO) return ['sin_creditos' => true, 'creditos' => (int) $u['creditos']];
    $u['creditos'] = (int) $u['creditos'] - COSTE_DOCUMENTO;
    return ['creditos' => (int) $u['creditos']];
  });
  if (!empty($reserva['sin_creditos'])) {
    salir(['ok' => false, 'sin_creditos' => true, 'creditos' => $reserva['creditos'],
           'error' => 'Te has quedado sin créditos. Mejora de plan para seguir procesando documentos.'], 402);
  }

  // 2) llamar a la IA
  $r = extraer_documento($b64, $mime);

  // 3) si falla, devolver el crédito
  if (!$r['ok']) {
    @error_log('[usar] ' . $r['motivo']);
    $creditos = db_transaccion(function (array &$db) use ($email) {
      $db['usuarios'][$email]['creditos'] = (int) $db['usuarios'][$email]['creditos'] + COSTE_DOCUMENTO;
      return (int) $db['usuarios'][$email]['creditos'];
    });
    salir(['ok' => false, 'creditos' => $creditos,
           'error' => 'Ahora mismo no he podido leer este documento. No te he descontado el crédito: inténtalo en un momento.'], 502);
  }

  $resultado = normalizar($r['datos']);
  $creditos = db_transaccion(function (array &$db) use ($email, $nombre) {
    $db['usuarios'][$email]['historial'][] = ['fecha' => gmdate('c'), 'accion' => 'documento', 'detalle' => $nombre, 'coste' => COSTE_DOCUMENTO];
    $db['usuarios'][$email]['historial'] = array_slice($db['usuarios'][$email]['historial'], -300);
    return (int) $db['usuarios'][$email]['creditos'];
  });
  salir(['ok' => true, 'creditos' => $creditos, 'resultado' => $resultado]);
}

if ($a === 'checkout') {
  // MODO DEMO: no se cobra nada. Al pasar a cobros reales, esto redirige a la
  // pasarela y es el aviso de pago el que recarga los créditos.
  if ($metodo !== 'POST') error_humano('Método no permitido', 405);
  $db = db_leer();
  $email = exige_sesion($db);
  $plan = (string) (cuerpo()['plan'] ?? '');
  if (!isset(PLANES[$plan]) || $plan === 'gratis') error_humano('Ese plan no existe.');

  $perfil = db_transaccion(function (array &$db) use ($email, $plan) {
    $u = &$db['usuarios'][$email];
    $u['plan'] = $plan;
    $u['creditos'] = PLANES[$plan]['creditos'];
    $u['renovacion'] = date('Y-m-d', strtotime('+30 days'));
    $u['historial'][] = ['fecha' => gmdate('c'), 'accion' => 'pago_simulado',
                         'detalle' => 'Plan ' . PLANES[$plan]['nombre'] . ' activado (pago simulado, no se ha cobrado nada)', 'coste' => 0];
    return perfil($u, $email);
  });
  salir(['ok' => true, 'demo' => true, 'perfil' => $perfil]);
}

if ($a === 'cancelar') {
  if ($metodo !== 'POST') error_humano('Método no permitido', 405);
  $db = db_leer();
  $email = exige_sesion($db);
  $perfil = db_transaccion(function (array &$db) use ($email) {
    $u = &$db['usuarios'][$email];
    $u['plan'] = 'gratis';
    $u['creditos'] = min((int) $u['creditos'], PLANES['gratis']['creditos']);
    $u['renovacion'] = null;
    $u['historial'][] = ['fecha' => gmdate('c'), 'accion' => 'cancelacion', 'detalle' => 'Suscripción cancelada (demo). Vuelves al plan gratuito', 'coste' => 0];
    return perfil($u, $email);
  });
  salir(['ok' => true, 'perfil' => $perfil]);
}

if ($a === 'webhook') {
  // MODO DEMO: no hace nada. Aquí llegará el aviso de la pasarela de pago real.
  salir(['ok' => true, 'demo' => true]);
}

error_humano('No encuentro esa dirección.', 404);
