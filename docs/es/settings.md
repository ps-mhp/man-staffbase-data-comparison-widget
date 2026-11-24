# Configuración

## Dimensiones (a la derecha, pestaña «Dimensiones»)

| Configuración | Descripción |
| --- | --- |
| Nombre | Aparece en la primera columna. Obligatorio. |
| Tipo | **Texto** (texto libre, se conservan los saltos de línea), **Número** (con unidad, valor máximo si se desea), **Sí/No** (marca de verificación o cruz), **Lista** (una entrada por línea, en forma de enumeración), **Selección** (un valor de entre opciones fijas), **Valoración** (1-5 estrellas), **Galería** (imágenes para hojear y ampliar, no compara nada). Por defecto: Texto. |
| Explicación | Opcional, aparece en letra pequeña debajo del nombre. |
| Unidades | Solo para números. Una o varias unidades, p. ej., «PS» y «kW»; la unidad aparece detrás de cada número. Si hay varias unidades, cada elemento tiene su propio campo por unidad, y en la página aparece una línea por unidad. El valor óptimo compara la primera unidad. |
| Valor óptimo | Solo para números: **Neutro** (sin marca), **Cuanto más alto, mejor** o **Cuanto más bajo, mejor**. Por defecto: Neutro. Las valoraciones siempre se consideran «cuanto más alto, mejor». |
| Opciones | Solo en caso de selección. Los valores entre los que cada elemento elige uno. Al menos uno. |
| Icono delante del nombre | Opcional, un icono de la biblioteca de iconos delante del nombre de la dimensión. |
| Símbolo para Sí / No | Solo en caso de Sí/No. Icono de la biblioteca de iconos; por defecto, una marca de verificación y una cruz. |
| Color para Sí / No | Solo en Sí/No. Un color MAN-CI, de estado o personalizado; por defecto, color de acento para Sí y gris para No. El color seleccionado se mantiene incluso en las filas atenuadas. |
| Tamaño de los símbolos | Solo en Sí/No. **Pequeño** (8 × 8 px), **Normal** (10 × 10 px) o **Grande** (12 × 12 px). Por defecto: Normal. |

Debajo de cada dimensión desplegada: desplazar hacia arriba/abajo, **duplicar** (la copia toma el tipo, la configuración y todos los valores, y aparece justo detrás) y eliminar.

## Elementos (izquierda y centro)

| Configuración | Descripción |
| --- | --- |
| Nombre | Aparece encima de la columna. Obligatorio. |
| Subtítulo | Opcional, una línea debajo del nombre. |
| Valores | Un campo por cada dimensión, acorde con el tipo. Si está en blanco, significa «sin especificar» y aparece como «–». En la página, los valores aparecen centrados en su columna. |

Puede haber tantos elementos y dimensiones como se desee; un máximo de 20 imágenes por galería. Las imágenes de una galería nunca se recortan: la altura de la fila de la galería se ajusta a la imagen más alta de todos los elementos.

## Diseño (a la derecha, pestaña «Diseño»)

| Configuración | Descripción |
| --- | --- |
| Encabezado | Opcional, aparece encima de la tabla. |
| Acentuado | **Rojo**, **antracita** o **azul**: color de las marcas de verificación, las estrellas, los iconos y los mejores valores. Por defecto: rojo. |
| Transponer | Invierte la tabla: los elementos como filas (nombre a la izquierda, permanece fijo al desplazarse), las dimensiones como columnas. Las opciones «Ocultar», «Valores máximos», «Solo diferencias» y «Filas visibles» siguen aplicándose; en este caso, los elementos se ocultan. Por defecto: desactivado. |
| Ocultar valores iguales | Las dimensiones en las que todos los elementos tienen el mismo valor se muestran en gris. «Sin datos» cuenta como un valor propio. Las galerías nunca se ocultan. Por defecto: activado. |
| Resaltar los mejores valores | Resalta el mejor valor en el caso de cifras con preferencia y en las valoraciones. Si todos los elementos tienen el mismo valor, no se resalta nada. Por defecto: activado. |

## Comportamiento (a la derecha, pestaña «Comportamiento»)

| Configuración | Descripción |
| --- | --- |
| Filas visibles | Cuántas filas (dimensiones) se muestran; el resto se oculta tras el botón «Mostrar más… filas». **0** muestra todas. Por defecto: 5. |
| Botón «Solo diferencias» | Muestra a los lectores, encima de la tabla, un botón que oculta las filas sin diferencias. La selección no se guarda. Valor predeterminado: desactivado. |
