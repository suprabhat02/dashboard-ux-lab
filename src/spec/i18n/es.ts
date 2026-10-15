import type { Messages } from './en';

const plural = new Intl.PluralRules('es-ES');

/** Spanish (neutral, Spain-leaning). Drafted by the author; native review pending. */
export const es: Messages = {
  meta: {
    siteName: 'Dashboard UX Lab',
    homeTitle:
      'Dashboard UX Lab — cómo debe comportarse un dashboard cuando los datos no son perfectos',
    homeDescription:
      'Un laboratorio interactivo de estados de dashboards: carga, respuestas lentas, resultados vacíos, fallos con reintento y acceso restringido. Hecho en React y en TypeScript sin framework a partir de una misma especificación.',
    labReactTitle: 'Implementación en React',
    labReactDescription:
      'Prueba un dashboard en React en condiciones reales: carga, respuestas lentas, resultados vacíos, fallos con reintento y acceso restringido.',
    labVanillaTitle: 'Implementación vanilla (en curso)',
    labVanillaDescription:
      'La implementación sin framework del Dashboard UX Lab, construida a partir de la misma especificación que la versión en React.',
    scenariosTitle: 'Guías de escenarios',
    scenariosDescription:
      'Cómo debe comportarse un dashboard en seis escenarios reales: cargado, cargando, lento, vacío, error con reintento y acceso restringido.',
    guideTitle: (scenario) => `${scenario}: guía del escenario`,
    accessibilityTitle: 'Accesibilidad',
    accessibilityDescription:
      'Qué se ha probado y qué no en el Dashboard UX Lab, cómo se ha probado y los problemas conocidos.',
    notFoundTitle: 'Página no encontrada',
    notFoundDescription: 'Esta página no existe.',
  },

  nav: {
    skip: 'Saltar al contenido',
    homeLabel: 'Dashboard UX Lab, inicio',
    by: 'por Suprabhat',
    main: 'Principal',
    lab: 'Laboratorio',
    scenarios: 'Escenarios',
    accessibility: 'Accesibilidad',
    github: 'GitHub',
    language: 'Idioma',
    themeTo: (theme) =>
      theme === 'dark' ? 'Cambiar al tema oscuro' : 'Cambiar al tema claro',
  },

  footer: {
    builtBy: 'Creado por',
    note: 'Solo datos de prueba; sin rastreo.',
    source: 'Código en GitHub',
    report: 'Informar de un problema',
  },

  home: {
    pill: 'Código abierto · React ahora, vanilla después',
    titleLead: 'Los dashboards pasan la mitad de su vida',
    titleAccent: 'sin cargar.',
    lede: 'Un laboratorio interactivo de los estados que casi todas las demos omiten: cargando, lento, vacío, con error y sin acceso. Rompe el dashboard a propósito y observa qué cambió, qué oyó un lector de pantalla y adónde fue el foco.',
    openLab: 'Abrir el laboratorio',
    readGuides: 'Leer las guías de escenarios',
    stripLabel: 'Los seis escenarios',
    howEyebrow: 'Cómo funciona',
    howTitle: 'Un espacio para experimentar, no una captura de pantalla',
    features: [
      {
        title: 'Rómpelo a propósito',
        body: 'Ajusta la latencia del servidor de 0 a 15 segundos, haz que la API falle una vez o siempre, cambia el rol del visitante. Cada combinación sigue las mismas reglas escritas.',
      },
      {
        title: 'Mira lo que no se ve',
        body: 'El inspector muestra cada transición de estado, cada anuncio de la región en vivo y cada movimiento programático del foco: el comportamiento que nunca aparece en una captura.',
      },
      {
        title: 'Compara dos implementaciones con justicia',
        body: 'La misma especificación, API simulada, textos y CSS, implementados por separado en React y en TypeScript sin framework, y verificados con una misma batería de pruebas. La versión vanilla es el siguiente hito.',
      },
    ],
    rulesEyebrow: 'Las reglas',
    rulesTitle: 'Seis decisiones que el laboratorio hace visibles',
    rules: [
      {
        lead: 'Sin esqueleto en respuestas rápidas.',
        body: 'Los marcadores solo aparecen tras 300 ms.',
      },
      {
        lead: 'Lento es tiempo, no un estado.',
        body: 'El mensaje escala a los 3 s; cancelar aparece a los 8 s.',
      },
      {
        lead: 'Vacío es una respuesta, no un error.',
        body: 'Nombra el filtro y ofrece una salida.',
      },
      {
        lead: 'Los fallos se explican y se recuperan.',
        body: 'ID de solicitud, un solo reintento, sin envíos dobles.',
      },
      {
        lead: 'Prohibido no es fallido.',
        body: 'Sin reintento para un 403; di quién puede dar acceso.',
      },
      {
        lead: 'Anunciar una vez, mover el foco poco.',
        body: 'Solo cuando desaparece el control enfocado.',
      },
    ],
    statusTitle: 'Estado del proyecto',
    statusBody:
      'La implementación en React, la especificación compartida y las pruebas automáticas están listas. Las pruebas manuales con lectores de pantalla y dispositivos reales están en curso y se publicarán en la página de accesibilidad, con los problemas conocidos.',
    statusA11yLink: 'Ver el estado de accesibilidad',
    statusFeedback:
      'Lo más útil que puedes aportar son comentarios sobre la especificación:',
    statusIssueLink: 'abre una incidencia',
  },

  lab: {
    eyebrow: 'Laboratorio',
    titleLead: 'El dashboard,',
    titleAccent: 'cuando algo sale mal',
    lede: 'Elige un escenario o ajusta la solicitud. Después observa la línea de estados y lo que oiría un lector de pantalla.',
    implNav: 'Implementación',
    impl: {
      react: { label: 'React', note: 'React 19 · hooks + reducer' },
      vanilla: { label: 'Vanilla', note: 'Sin framework · en curso' },
    },
    controlsLabel: 'Controles del laboratorio',
    railToggle: 'Escenario:',
    scenarioHeading: 'Escenario',
    presetsLegend: 'Escenarios predefinidos',
    tune: 'Ajustar la solicitud',
    custom: 'Personalizado',
    latency: 'Latencia del servidor',
    ms: (value) => `${value} ms`,
    latencyHint: (skeletonMs, slowS, stalledS) =>
      `Esqueleto a los ${skeletonMs} ms · aviso a los ${slowS} s · cancelar a los ${stalledS} s`,
    failureLegend: 'Fallo del servidor',
    failure: { never: 'Nunca', once: 'Una vez', always: 'Siempre' },
    role: 'Rol del visitante',
    planFilter: 'Filtro de plan',
    replay: 'Repetir solicitud',
    copyLink: 'Copiar enlace',
    copied: 'Copiado',
    linkCopied: 'Enlace copiado al portapapeles.',
    copyFailed: 'No se pudo copiar. Copia la barra de direcciones.',
    explainHeading: 'Qué estás viendo',
    explainWhat: 'Qué ocurre',
    explainWhy: 'Por qué',
    explainA11y: 'Accesibilidad',
    readGuide: (title) => `Leer la guía completa de «${title}»`,
    customWhat: (latency, failure, role, plan) =>
      `Personalizado: ${latency} de latencia, el servidor ${failure}, rol ${role}, ${plan}.`,
    customFailure: {
      never: 'nunca falla',
      once: 'falla una vez',
      always: 'siempre falla',
    },
    customWhy:
      'Combina los controles para encontrar casos límite: una solicitud lenta que luego falla, un lector con un filtro vacío, un reintento que sigue fallando. El dashboard sigue las mismas reglas en todas las combinaciones.',
    customA11y:
      'Mira la pestaña Lector de pantalla: cada cambio que provocas produce como mucho un anuncio por estado, nunca una cola.',
    vanilla: {
      pill: 'Siguiente hito',
      title: 'La implementación vanilla está en construcción',
      body: 'Se escribirá a partir de la especificación, no portando el código de React, y deberá superar la misma batería de pruebas de extremo a extremo antes de publicarse aquí. Hasta entonces, los controles de esta página solo actualizan la URL.',
      openReact: 'Abrir la versión en React',
      readSpec: 'Leer la especificación',
    },
    noscript:
      'Este dashboard interactivo necesita JavaScript. Las guías de escenarios funcionan sin él.',
  },

  inspector: {
    heading: 'Inspector',
    tablist: 'Vistas del inspector',
    tabs: { timeline: 'Línea de estados', announce: 'Lector de pantalla', focus: 'Foco' },
    clear: 'Limpiar',
    hints: {
      timeline: 'Cada solicitud, transición de estado y fase de carga, en orden.',
      announce:
        'Exactamente lo que el dashboard envió a sus regiones en vivo: lo que oye un usuario de lector de pantalla sin moverse.',
      focus:
        'Movimientos programáticos del foco (raros por diseño) y dónde está el foco del teclado ahora.',
    },
    logLabels: {
      timeline: 'Registro de la línea de estados',
      announce: 'Registro de anuncios',
      focus: 'Registro de movimientos del foco',
    },
    focusNow: 'Foco actual:',
    focusLost: 'cuerpo de la página (foco perdido)',
    empty: 'Aún nada. Cambia de escenario o repite la solicitud.',
    kinds: {
      ready: 'listo',
      request: 'solicitud',
      state: 'estado',
      phase: 'fase',
      polite: 'cortés',
      assertive: 'urgente',
      moved: 'movido',
      filter: 'filtro',
    },
    entries: {
      ready: (implementation) => `implementación ${implementation} montada`,
      requestStart: (attempt) => `solicitud n.º ${attempt} enviada`,
      requestSettled: (attempt) => `respuesta n.º ${attempt} recibida`,
      requestAborted: (attempt) =>
        `solicitud n.º ${attempt} cancelada (sustituida o anulada)`,
      phase: (phase) => `fase de carga: ${phase}`,
      filter: 'ajustes cambiados desde el propio dashboard',
    },
  },

  dashboard: {
    company: 'Northstar Cloud',
    title: 'Resumen de ingresos',
    subtitle: (month) => `Métricas de suscripción · ${month}`,
    filterLabel: 'Plan',
    kpisLabel: 'Métricas clave',
    kpi: {
      mrr: 'Ingresos recurrentes mensuales',
      activeAccounts: 'Cuentas activas',
      arpa: 'Ingreso medio por cuenta',
      churnRate: 'Bajas mensuales',
    },
    delta: (direction, magnitude, isRate, month) =>
      `${direction === 'up' ? 'Sube' : 'Baja'} ${magnitude}${isRate ? ' puntos porcentuales' : ' %'} respecto a ${month}`,
    deltaFlat: (month) => `Sin cambios respecto a ${month}`,
    pointsUnit: 'pp',
    revenue: 'Ingresos recurrentes mensuales',
    revenueMeta: 'Últimos 12 meses · USD',
    revenueCaption: 'Ingresos recurrentes mensuales por mes, últimos 12 meses',
    accounts: 'Cuentas',
    accountsCaption: (count, plan) =>
      `${count} ${plural.select(count) === 'one' ? 'cuenta' : 'cuentas'} · ${plan}. Selecciona un encabezado de columna para ordenar.`,
    showTable: 'Ver datos como tabla',
    hideTable: 'Ocultar tabla de datos',
    monthHeader: 'Mes',
    columns: {
      name: 'Cuenta',
      plan: 'Plan',
      seats: 'Licencias',
      mrr: 'MRR',
      status: 'Estado',
      renewsOn: 'Renovación',
    },
    plans: {
      all: 'Todos los planes',
      starter: 'Starter',
      growth: 'Growth',
      enterprise: 'Enterprise',
      legacy: 'Legacy',
    },
    statuses: {
      active: 'Activa',
      trial: 'Prueba',
      past_due: 'Pago vencido',
      churned: 'Baja',
    },
    roles: { none: 'Sin acceso', viewer: 'Lector', analyst: 'Analista' },
    chart: {
      summary: (trend, from, fromMonth, to, toMonth, peak, peakMonth) =>
        `Gráfico de barras. Los ingresos recurrentes mensuales ${
          trend === 'rose' ? 'subieron' : trend === 'fell' ? 'bajaron' : 'se mantuvieron'
        } de ${from} en ${fromMonth} a ${to} en ${toMonth}, con un máximo de ${peak} en ${peakMonth}.`,
      noData: 'No hay datos de ingresos.',
    },
    loading: {
      announce: 'Cargando los datos del dashboard.',
      slowTitle: 'Esto está tardando más de lo habitual.',
      slowBody: 'El servidor sigue trabajando. No hace falta recargar.',
      stalledTitle: 'Seguimos esperando al servidor.',
      stalledBody: 'Puedes seguir esperando o cancelar esta solicitud.',
      cancel: 'Cancelar solicitud',
    },
    cancelled: {
      title: 'Solicitud cancelada',
      body: 'El dashboard no se ha actualizado. Vuelve a cargarlo cuando quieras.',
      action: 'Volver a cargar',
      announce: 'Solicitud cancelada.',
    },
    empty: {
      title: (plan) => `No hay cuentas en el plan ${plan}`,
      body: 'La solicitud funcionó, pero nada coincide con este filtro. Los planes Legacy se retiraron, así que ningún cliente los tiene.',
      action: 'Ver todos los planes',
      announce: (plan) => `No hay resultados para ${plan}.`,
    },
    error: {
      title: 'No hemos podido cargar este dashboard',
      body: 'El servicio de analítica no está disponible temporalmente (503). Normalmente se resuelve volviendo a intentarlo.',
      requestIdLabel: 'ID de solicitud',
      retry: 'Reintentar',
      retrying: 'Reintentando…',
      announce: 'El dashboard no se pudo cargar. Puedes reintentarlo.',
    },
    forbidden: {
      title: 'No tienes acceso a este dashboard',
      body: 'Los dashboards de ingresos están limitados a finanzas y dirección. Pide a un administrador del espacio de trabajo el rol de Lector o Analista.',
      requestIdLabel: 'Referencia',
      announce: 'No tienes acceso a este dashboard.',
    },
    widgetRestricted: {
      title: 'Los detalles de las cuentas están restringidos',
      body: (current, required) =>
        `Tu rol de ${current} permite ver totales y tendencias. Los ingresos por cuenta requieren el rol de ${required}.`,
      currentRole: (role) => `Rol actual: ${role}`,
    },
    loaded: { announce: (plan) => `Dashboard actualizado: ${plan}.` },
    focus: {
      heading: (text) => `encabezado «${text}»`,
      button: (text) => `botón «${text}»`,
      cancelRemoved: 'Se eliminó el botón Cancelar',
      actionRemoved: 'Se eliminó el botón de acción',
    },
  },

  scenarios: {
    loaded: {
      title: 'Cargado',
      summary: 'Una respuesta normal y rápida con acceso completo.',
      what: 'Los datos llegan en unos 0,7 segundos. Los esqueletos aparecen a los 300 ms y se sustituyen por contenido exactamente del mismo tamaño.',
      why: 'El caso ideal es la referencia con la que se mide cualquier otro estado. Reservar las dimensiones finales mantiene el desplazamiento del diseño cerca de cero.',
      accessibility:
        'La región del dashboard se marca como ocupada mientras carga. No se anuncia nada en la primera carga; un cambio que provocas se anuncia una vez al terminar.',
      guidance: [
        'Reserva el tamaño final de cada widget antes de que lleguen los datos, para que el contenido sustituya a los marcadores en lugar de empujar la página.',
        'Anuncia solo las actualizaciones que causó el usuario. Anunciar la carga inicial compite con el lector de pantalla mientras lee la página.',
        'Formatea los números para quien lee: moneda con unidades y variaciones con la dirección en palabras, no solo con color o una flecha.',
      ],
      antiPatterns: [
        'Indicadores giratorios que desplazan el diseño cuando llega el contenido.',
        'Variaciones transmitidas solo con rojo y verde.',
      ],
    },
    loading: {
      title: 'Cargando',
      summary:
        'Una respuesta de dos segundos: lo bastante larga para notarse y lo bastante corta para esperar.',
      what: 'Durante los primeros 300 ms no cambia nada. Después, los esqueletos mantienen la forma de cada widget hasta que llegan los datos.',
      why: 'La mayoría de respuestas son rápidas. Retrasar el esqueleto evita un destello de marcadores en solicitudes rápidas y sigue dando información en las lentas.',
      accessibility:
        '«Cargando los datos del dashboard» se anuncia una vez y la región lleva aria-busy para que los lectores de pantalla no lean contenido a medio dibujar.',
      guidance: [
        'Retrasa los esqueletos unos 300 ms. Por debajo de eso, un marcador parece un fallo, no un progreso.',
        'Los esqueletos deben reflejar el diseño real (número de tarjetas, altura del gráfico, filas de la tabla), no un bloque genérico.',
        'Marca la región que se actualiza con aria-busy y anuncia la carga una sola vez, de forma cortés.',
      ],
      antiPatterns: [
        'Un indicador a pantalla completa que oculta contenido que el usuario ya podía leer.',
        'Anunciar «cargando» una y otra vez en cada renderizado.',
      ],
    },
    slow: {
      title: 'Respuesta lenta',
      summary: 'Doce segundos. La interfaz escala en lugar de girar para siempre.',
      what: 'Esqueletos a los 300 ms, un mensaje de «está tardando más de lo habitual» a los 3 segundos y la opción de cancelar a los 8 segundos.',
      why: 'Un indicador que no cambia deja de informar tras unos segundos. Escalar el mensaje dice que el sistema sigue trabajando y permite decidir dejar de esperar.',
      accessibility:
        'Cada escalado se anuncia una vez. Cancelar es un botón real que recibe el foco solo cuando vas a él; la interfaz nunca mueve el foco por su cuenta mientras esperas.',
      guidance: [
        '«Lento» no es un estado aparte. Es la misma solicitud observada más tarde, así que modélalo como tiempo transcurrido, no como estado.',
        'Escala por pasos: reconoce el retraso y después ofrece una salida.',
        'Cancelar debe dejar la interfaz en un estado claro y recuperable, con una forma de volver a intentarlo.',
      ],
      antiPatterns: [
        'Indicadores infinitos sin mensaje ni salida.',
        'Cancelar una solicitud pero seguir mostrando su respuesta cuando llega tarde.',
      ],
    },
    empty: {
      title: 'Resultados vacíos',
      summary: 'La solicitud funciona, pero nada coincide con el filtro.',
      what: 'El plan Legacy no tiene cuentas. El dashboard explica por qué está vacío y ofrece un siguiente paso.',
      why: 'Vacío es una respuesta correcta, no un error. Debe decir qué se buscó, por qué no hubo coincidencias y cómo llegar a datos útiles.',
      accessibility:
        'El mensaje de vacío se anuncia una vez y la acción de recuperación es un botón normal, accesible justo después del filtro.',
      guidance: [
        'Deduce «vacío» de los datos, nunca de una bandera. Las API reales devuelven listas vacías, no estados vacíos.',
        'Nombra el filtro que produjo el resultado vacío y ofrece quitarlo.',
        'Mantén el estado vacío visualmente distinto de un error para que nadie reintente algo que funcionó.',
      ],
      antiPatterns: [
        'Un gráfico en blanco con ejes y sin explicación.',
        '«Algo salió mal» para una consulta que simplemente no encontró nada.',
      ],
    },
    error: {
      title: 'Error con reintento',
      summary: 'La primera solicitud falla con un 503. Reintentar lo resuelve.',
      what: 'El servidor responde con un fallo temporal. El dashboard lo explica con lenguaje claro, muestra un ID de solicitud y ofrece reintentar.',
      why: 'Los fallos temporales son habituales y suelen recuperarse. Un mensaje claro y una única acción evidente resuelven la mayoría de sesiones sin soporte.',
      accessibility:
        'El fallo se anuncia. Mientras se reintenta, el foco se queda en el botón Reintentar; cuando funciona y el botón desaparece, el foco pasa al encabezado del dashboard para no perderse nunca.',
      guidance: [
        'Di qué falló y qué puede hacer el usuario, no solo un código de estado.',
        'Muestra un ID de solicitud que se pueda dar a soporte.',
        'Evita envíos dobles mientras un reintento está en curso.',
        'Si desaparece el control que tenía el foco, mueve el foco a un lugar con sentido.',
      ],
      antiPatterns: [
        'Botones de reintento que se pueden activar dos veces.',
        'El foco que salta al inicio de la página tras un reintento correcto.',
      ],
    },
    restricted: {
      title: 'Acceso restringido',
      summary: 'El visitante no tiene acceso a este dashboard.',
      what: 'El servidor responde con un 403. En lugar de un error, el dashboard explica quién puede dar acceso. No hay botón de reintentar, porque reintentar no ayuda.',
      why: 'Los problemas de permisos no son fallos. Tratarlos como errores invita a reintentos inútiles; explicar cómo obtener acceso los resuelve. Prueba el rol «Lector» para ver un único widget restringido.',
      accessibility:
        'La restricción se anuncia una vez y la explicación es texto normal, no una alerta. Los encabezados se mantienen para que la estructura de la página siga siendo navegable.',
      guidance: [
        'Distingue «no puedes ver esto» de «esto falló». Necesitan textos y acciones distintos.',
        'Restringe en el ámbito útil más pequeño. Un lector que no ve los ingresos por cuenta aún puede ver la tendencia.',
        'Di quién puede dar acceso en lugar de limitarte a denegarlo.',
      ],
      antiPatterns: [
        'Un error genérico con botón de reintentar para un 403.',
        'Ocultar del todo los widgets restringidos, de modo que nadie sabe que esos datos existen.',
      ],
    },
  },

  guides: {
    eyebrow: 'Guías',
    title: 'Guías de escenarios',
    lede: 'Cada guía explica un estado: qué debe ocurrir, por qué, cómo se anuncia y qué errores pretende sacar a la luz. Cada guía enlaza con el laboratorio con ese escenario ya seleccionado.',
    breadcrumb: 'Ruta de navegación',
    tryIt: 'Probarlo en el laboratorio',
    behaviour: 'Comportamiento esperado',
    why: 'Por qué se comporta así',
    accessibility: 'Accesibilidad',
    antiPatterns: 'Errores que este escenario saca a la luz',
    settings: {
      latency: 'Latencia del servidor',
      failure: 'Fallo del servidor',
      role: 'Rol del visitante',
      plan: 'Filtro de plan',
    },
    failureValues: {
      never: 'Nunca',
      once: 'Solo el primer intento',
      always: 'Todos los intentos',
    },
    more: 'Más escenarios',
  },

  accessibilityPage: {
    eyebrow: 'Estado de las pruebas',
    title: 'Accesibilidad',
    lede: 'Esta página dice qué se ha probado y cómo. Las comprobaciones automáticas solo detectan una parte de lo que importa, así que aquí nada se califica de «accesible» hasta haberlo probado con tecnologías de apoyo reales.',
    matrixTitle: 'Matriz de pruebas',
    caption: (date) => `Última actualización: ${date}`,
    check: 'Comprobación',
    status: 'Estado',
    rows: [
      {
        check: 'axe-core en cada escenario y en los tres idiomas (automático)',
        status: 'Automatizado en CI',
      },
      {
        check: 'Recorrido solo con teclado en cada escenario',
        status: 'Automatizado en CI; falta la prueba manual',
      },
      { check: 'NVDA + Firefox (Windows)', status: 'Aún sin probar' },
      { check: 'VoiceOver + Safari (macOS)', status: 'Aún sin probar' },
      { check: 'VoiceOver + Safari (iOS)', status: 'Aún sin probar' },
      { check: 'TalkBack + Chrome (Android)', status: 'Aún sin probar' },
      {
        check: 'Árabe (de derecha a izquierda) con lector de pantalla',
        status: 'Aún sin probar',
      },
      { check: 'Zoom al 400 % / reflujo a 320 px', status: 'Aún sin probar' },
      { check: 'Colores forzados de Windows', status: 'Estilos escritos; sin verificar' },
    ],
    knownTitle: 'Problemas conocidos',
    known: [
      'Las barras del gráfico no reciben el foco del teclado por diseño; los datos están disponibles como tabla.',
      'La implementación vanilla aún no está construida.',
      'En pantallas estrechas el gráfico se reduce y las etiquetas de los ejes quedan pequeñas; la vista «Ver datos como tabla» es la alternativa legible hasta que llegue un diseño para pantallas estrechas.',
      'Las traducciones al español y al árabe las redactó el autor y aún no las ha revisado un hablante nativo.',
    ],
    reportTitle: 'Informar de un problema',
    reportBody:
      'Si algo no funciona con tu configuración, abre una incidencia e indica tu navegador, idioma y tecnología de apoyo.',
    reportLink: 'Abrir una incidencia',
  },

  notFound: {
    eyebrow: '404',
    title: 'Un estado vacío propio',
    lede: 'La solicitud funcionó, pero no hay nada en esta dirección.',
    back: 'Volver al laboratorio',
  },
};
