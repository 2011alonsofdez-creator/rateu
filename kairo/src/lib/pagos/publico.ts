/* La parte de los pagos que sí puede ver el navegador: un interruptor y
   la forma de construir el enlace. Ni claves ni direcciones de tienda:
   esas viven solo en el servidor, en /api/pagos/ir. */

/** Los botones de comprar solo aparecen si esto vale 1. Se pone a mano
 *  cuando la tienda ya está montada y probada. */
export const HAY_TIENDA = process.env.NEXT_PUBLIC_TIENDA === "1";

/** El botón no va a la tienda: va a una ruta nuestra que le añade tu
 *  identificador y te manda allí. Sin eso, el proveedor avisaría de un
 *  pago sin decir de quién es. */
export const comprar = (producto: string) => `/api/pagos/ir?producto=${producto}`;
