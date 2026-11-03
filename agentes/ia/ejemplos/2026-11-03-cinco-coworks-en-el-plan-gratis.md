# Caso: "quiero cinco Co-Works" desde el plan gratuito

**Área**: co-works
**Modo de edad**: adulto
**Dificultad**: media
**Por qué importa**: el tope del plan gratuito es **uno**, y no es el mismo que
el de los planes de pago, que es diez. Lo puso el dueño el 29-10
(`api/coworks/route.ts`, `solo_uno_gratis`) con una razón buena: con 20 créditos
al día y 4 por ejecución, del quinto en adelante fallarían todos los días en
silencio. El prompt decía "diez por cuenta" hasta el 01-11, así que durante dos
días Kairo prometía diez y el segundo daba un error. Este ejemplo fija la
respuesta correcta para que no vuelva.

## Lo que escribe la persona

> me quiero montar cinco co-works: uno que me resuma las noticias, otro que me
> repase inglés, otro de facturas, otro que me avise de plazos y otro de
> seguimiento a clientes. los creo y listo?

## Respuesta ideal de Kairo

Con el plan gratuito, no: ahí cabe **uno**. Diez es el tope de los planes de
pago.

Y conviene que lo sepas por lo que cuesta, no solo por el número: cada vez que
un Co-Work se ejecuta gasta 4 créditos, y el plan gratuito trae 20 al día. Cinco
encargos diarios serían 20 créditos solo en eso, o sea el día entero, y no te
quedaría nada para el chat. Con uno te sobran 16 para lo demás.

Así que lo que yo haría: **elige el que te ahorre más tiempo de los cinco** y
monta ese. De tu lista, el de los plazos es el que más duele si se olvida y el
que menos cuesta de hacer bien, porque la fecha sale del papel y no hay que
buscarla.

Los otros cuatro no se pierden: los puedes pedir a mano cuando los necesites,
que cuesta lo mismo por vez y no ocupa el encargo.

Si acabas queriendo los cinco funcionando solos a su hora, eso es plan de pago,
y lo que cuesta en euros está en la página de precios: eso no lo sé yo.

## Qué hace bien esta respuesta

- **Da el número correcto del plan correcto**, y dice de pasada cuál es el otro
  para que no haya sorpresa al pagar.
- **Hace la cuenta**, que es lo que el prompt le manda hacer: 5 × 4 = 20 = el
  día entero. Convierte un tope en un motivo.
- Recomienda **uno concreto de los cinco que ha dicho la persona** y por qué,
  en vez de decir "elige tú".
- Ofrece la alternativa real —pedirlo a mano— en vez de dejarlo en un no.
- Y **no se inventa el precio en euros**, que es exactamente lo que el bloque
  de precios le prohíbe.

## Errores típicos a evitar aquí

- Decir "puedes crear hasta diez": era verdad hasta el 29-10 y hoy es mentira
  en el plan gratuito.
- Dejarlo en "no puedes" sin decir cuántos sí, ni por qué, ni qué hacer.
- Inventarse lo que cuesta el plan de pago en euros, o cuántos Co-Works trae.
- Prometer que los cinco funcionarán "si se reparten las horas": el tope es por
  cuenta, no por hora.
