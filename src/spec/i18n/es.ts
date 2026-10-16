import type { Messages } from './en';

const plural = new Intl.PluralRules('es-ES');

/** Spanish (neutral, Spain-leaning). Drafted by the author; native review pending. */
export const es: Messages = {
  meta: {
    siteName: 'Dashboard UX Lab',
    homeTitle: 'Dashboard UX Lab: estados de carga, vacío y error bien hechos',
    homeDescription:
      'Provoca estados de carga, lentitud, vacío, error y acceso restringido en un panel real y mira cómo debe verse, anunciarse y gestionar el foco.',
    labReactTitle: 'Implementación en React',
    labReactDescription:
      'Prueba un panel en React en condiciones reales: carga, respuestas lentas, resultados vacíos, fallos con reintento y acceso restringido.',
    labVanillaTitle: 'Implementación en TypeScript sin framework',
    labVanillaDescription:
      'La implementación sin framework del Dashboard UX Lab, construida a partir de la misma especificación que la versión en React.',
    scenariosTitle: 'Guías de escenarios',
    scenariosDescription:
      'Cómo debe comportarse un panel en seis escenarios reales: cargado, cargando, lento, vacío, error con reintento y acceso restringido.',
    guideTitle: (scenario) => `${scenario}: guía del escenario`,
    guideDescription: (summary) =>
      `${summary} Comportamiento esperado, accesibilidad y errores que revela.`,
    ogImageAlt:
      'Dashboard UX Lab: una solicitud de un panel dibujada como una línea de tiempo de 0 a 12 segundos, con marcadores a los 300 ms, aviso de demora a los 3 s y Cancelar a los 8 s.',
    accessibilityTitle: 'Accesibilidad',
    accessibilityDescription:
      'Qué se ha probado y qué no en el Dashboard UX Lab, cómo se ha probado y los problemas conocidos.',
    compareTitle: 'React y sin framework, lado a lado',
    compareDescription:
      'El mismo panel hecho con React y sin framework, lado a lado: unos mismos controles, tiempo de arranque, tamaño de descarga y si ambos se comportan igual.',
    embedTitle: (build: string) => `Versión ${build}, incrustada`,
    screenReadersTitle: 'Guion de prueba con lector de pantalla',
    screenReadersDescription:
      'Lo que un lector de pantalla debe decir en cada escenario del panel, calculado a partir de la especificación y comprobado en las dos versiones, con resultados de NVDA, VoiceOver y TalkBack.',
    notFoundTitle: 'Página no encontrada',
    notFoundDescription: 'Esta página no existe.',
  },

  nav: {
    skip: 'Saltar al contenido',
    homeLabel: 'Dashboard UX Lab, inicio',
    main: 'Principal',
    lab: 'Laboratorio',
    scenarios: 'Escenarios',
    accessibility: 'Accesibilidad',
    compare: 'Comparar',
    github: 'GitHub',
    language: 'Idioma',
    menu: 'Menú',
    theme: 'Tema',
    themes: { light: 'Claro', dark: 'Oscuro', system: 'Sistema' },
  },

  author: {
    title: 'Sobre el autor',
    name: 'Suprabhat Kumar',
    role: 'Ingeniero front-end sénior',
    bio: 'Creo que la web es de todas las personas. Construyo interfaces que siguen funcionando con una conexión lenta, con un lector de pantalla, con el teclado y en cualquier idioma, porque quien está al otro lado puede usar cualquiera de ellos.',
    bio2: 'Este laboratorio es gratuito y de código abierto: mi pequeña aportación a un internet abierto que funcione para todo el mundo.',
    portraitAlt: 'Retrato de Suprabhat Kumar',
    links: 'Encuéntrame en',
    portfolio: 'Portafolio',
  },
  footer: {
    illustrations: 'Ilustraciones de Storyset',
    note: 'Solo datos de prueba; sin rastreo.',
    source: 'Código en GitHub',
    report: 'Informar de un problema',
  },

  home: {
    hero: {
      title: 'Diseña los estados del panel que nadie captura en pantalla',
      lede: 'Un panel real pasa gran parte del tiempo cargando, esperando a servicios lentos, sin nada que mostrar, fallando u ocultando datos que la persona no tiene permiso para ver. Este laboratorio te permite provocar cada uno de esos estados a propósito y ver cómo debe responder un panel bien hecho: en pantalla, en el lector de pantalla y con el foco del teclado.',
      facts:
        'Seis escenarios, tres idiomas y dos implementaciones independientes de una misma especificación, probadas en Chromium, Firefox y WebKit con cada cambio.',
      openLab: 'Abrir el laboratorio',
      readGuides: 'Leer las guías de escenarios',
    },
    problem: {
      title: 'El problema',
      intro:
        'Los diseños y las demos de paneles casi siempre muestran el caso ideal: los datos llegan al instante, todos los filtros devuelven resultados y cualquier persona puede verlo todo. En producción, los demás estados son habituales, y es ahí donde se gana o se pierde la confianza.',
      symptomsTitle: 'Con qué se encuentran realmente las personas usuarias',
      symptoms: [
        'Un indicador de carga que nunca cambia, sin ninguna pista de si algo sigue ocurriendo.',
        'Contenido que salta de sitio a medida que cada widget termina de cargar en un momento distinto.',
        'Un gráfico en blanco para un filtro que simplemente no encontró nada, sin ninguna explicación.',
        '«Algo salió mal» ante un problema de permisos, con un botón Reintentar que nunca podrá servir.',
        'Botones de reintento que envían la misma solicitud dos veces, y respuestas tardías que sobrescriben datos más recientes.',
        'Personas que usan lector de pantalla y no oyen nada cuando cambian los datos, u oyen una cola de avisos desfasados.',
        'El foco del teclado que salta al principio de la página cuando desaparece un botón.',
      ],
    },
    traditional: {
      title: 'Cómo se suele resolver',
      intro:
        'La mayoría de los equipos llega a estos estados del mismo modo, un atajo tras otro:',
      steps: [
        {
          title: 'El diseño cubre el estado con datos',
          body: 'Las maquetas muestran datos completos. Los estados de carga, vacío y error se dejan para después o se reducen a un indicador y un mensaje genéricos.',
        },
        {
          title: 'Cada componente improvisa',
          body: 'Cada widget añade su propio indicador y su propio texto de error, así que los tiempos, la redacción y la forma de recuperarse cambian dentro de la misma página.',
        },
        {
          title: 'Las pruebas dependen de ralentizar la red a mano',
          body: 'Alguien limita la red del navegador una vez, echa un vistazo y sigue adelante. El comportamiento nunca se documenta, así que se va desviando.',
        },
        {
          title: 'La accesibilidad se revisa al final',
          body: 'Los avisos y el comportamiento del foco se revisan en una auditoría tardía, cuando cambiarlos sale caro.',
        },
      ],
      why: 'Ninguno de estos pasos es un error por sí solo. Juntos hacen que nadie se responsabilice de los estados que más ven las personas en condiciones reales.',
    },
    approach: {
      title: 'Cómo ayuda este laboratorio',
      intro:
        'El laboratorio trata cada estado como un comportamiento de primera clase y especificado, y hace visibles las partes de ese comportamiento que normalmente no se ven.',
      points: [
        {
          title: 'Una especificación de comportamiento por escrito',
          body: 'Los tiempos (nada durante 300 ms, esqueletos hasta los 3 s, una explicación a los 3 s y Cancelar a los 8 s), los textos, los avisos y las reglas del foco están documentados, así que se pueden revisar y debatir.',
        },
        {
          title: 'Escenarios reproducibles',
          body: 'Cada combinación de latencia, fallo, rol y filtro es un enlace. Quien diseña, quien desarrolla y quien prueba pueden ver exactamente el mismo estado.',
        },
        {
          title: 'Un inspector para lo que las capturas no muestran',
          body: 'Una línea de tiempo en directo muestra cada solicitud y cada cambio de estado, cada mensaje enviado al lector de pantalla y cada movimiento programático del foco.',
        },
        {
          title: 'Una especificación, dos implementaciones',
          body: 'El mismo comportamiento está construido en React y en TypeScript sin framework, y una misma batería de pruebas verifica ambas, así que la comparación es justa.',
        },
        {
          title: 'Tres idiomas, incluido uno de derecha a izquierda',
          body: 'Todo funciona en inglés, español y árabe, con diseños reflejados, formatos numéricos locales y reglas de plural propias.',
        },
      ],
    },
    comparison: {
      title: 'En qué se diferencia de las herramientas que quizá ya usas',
      intro:
        'El laboratorio es una referencia, no un sustituto. Estas herramientas son excelentes en lo suyo; la tabla muestra hasta dónde llega cada una.',
      caption:
        'Herramientas habituales para construir y probar los estados de un panel, y qué cubre cada una',
      columns: { tool: 'Herramienta', strength: 'Sirve para', gap: 'Lo que no te da' },
      rows: [
        {
          tool: 'Herramientas para desarrolladores del navegador (limitación de red)',
          strength: 'Ralentizar o bloquear solicitudes reales para ver qué ocurre.',
          gap: 'Una definición de lo que debería ocurrir, estados repetibles que se puedan compartir o una vista de los avisos y del foco.',
        },
        {
          tool: 'Mock Service Worker (MSW)',
          strength:
            'Simular respuestas, retrasos y errores de la API en el navegador y en las pruebas.',
          gap: 'Criterios sobre cómo debe responder la interfaz a esas respuestas.',
        },
        {
          tool: 'Storybook',
          strength:
            'Construir y documentar componentes de forma aislada, con una historia por estado.',
          gap: 'Las transiciones entre estados a lo largo del tiempo, como una solicitud lenta que acaba en error y luego en un reintento.',
        },
        {
          tool: 'Bibliotecas de componentes (esqueletos, estados vacíos y de resultado)',
          strength: 'Piezas listas para cada estado.',
          gap: 'Cuándo mostrar cada una, durante cuánto tiempo y qué anunciar.',
        },
        {
          tool: 'Bibliotecas de obtención de datos (TanStack Query, SWR)',
          strength:
            'Estado de las solicitudes, caché, reintentos y cancelación en el código.',
          gap: 'El diseño de cada estado tal como lo ve la persona usuaria.',
        },
        {
          tool: 'Dashboard UX Lab',
          strength:
            'Una referencia especificada, inspeccionable y comprobable del comportamiento de cada estado, en tres idiomas.',
          gap: 'Componentes para producción o una biblioteca que instalar. Úsalo junto con las herramientas anteriores.',
        },
      ],
    },
    audience: {
      title: 'Para quién es',
      groups: [
        {
          title: 'Desarrolladores front-end',
          body: 'Ver cómo funcionan juntos la gestión de solicitudes, la cancelación, los avisos y la gestión del foco, y leer el código que hay detrás.',
        },
        {
          title: 'Diseño y producto',
          body: 'Usar los escenarios y las guías como lista de comprobación y como vocabulario común para especificar los estados más allá del caso ideal.',
        },
        {
          title: 'Revisión de accesibilidad y pruebas',
          body: 'Reproducir cualquier estado desde un enlace y ver exactamente qué se anunció y adónde fue el foco.',
        },
      ],
    },
    demo: {
      controlsLabel: 'Estado de la vista previa',
      play: 'Reproducir la vista previa',
      pause: 'Pausar la vista previa',
      openInLab: 'Abrir este estado en el laboratorio',
      ruler: {
        label: 'Tiempo desde que se envió la solicitud',
        skeleton: 'Marcadores',
        slow: 'Avisa de la demora',
        cancel: 'Ofrece cancelar',
        response: 'Respuesta',
      },
      captions: {
        loaded:
          'Los datos llegan en menos de un segundo y el contenido sustituye a marcadores exactamente del mismo tamaño.',
        loading:
          'Durante los primeros 300 ms no cambia nada. Después, los esqueletos mantienen la forma de lo que va a llegar.',
        slow: 'A los 3 segundos la interfaz lo dice, en lugar de girar en silencio.',
        empty:
          'Nada coincide con el filtro. El panel explica por qué y ofrece una salida.',
        error:
          'Un fallo temporal, explicado con palabras claras, con un ID de solicitud y un único Reintentar.',
        restricted:
          'Sin acceso no es un error: no hay Reintentar, solo quién puede dar acceso.',
      },
    },
    stack: {
      title: 'Construido y probado con',
      pause: 'Pausar la lista en movimiento',
      play: 'Reanudar la lista en movimiento',
    },
    statement:
      'Un panel se juzga menos por cómo se ve con datos perfectos que por cómo se comporta cuando esos datos llegan tarde, faltan, fallan o no se pueden ver.',
    cta: {
      title: 'Rompe un panel a propósito',
      body: 'Ralentízalo, haz que falle, quítale el acceso y observa qué hace una interfaz bien construida al respecto.',
      primary: 'Abrir el laboratorio',
      secondary: 'Leer la especificación en GitHub',
      actionsTitle: 'Tres formas de romperlo',
      actions: [
        {
          label: 'Ralentízalo',
          detail:
            'Una respuesta de 12 segundos. La interfaz lo dice y luego ofrece Cancelar.',
        },
        {
          label: 'Haz que falle',
          detail:
            'Un 503 en el primer intento. Un mensaje claro, un Reintentar y nada perdido.',
        },
        {
          label: 'Quítale el acceso',
          detail:
            'Una persona sin permiso. Sin Reintentar: solo quién puede darle acceso.',
        },
      ],
    },
    scenariosTitle: 'Seis escenarios para explorar',
    scenariosIntro:
      'Cada uno abre el laboratorio en ese estado. Todos los escenarios tienen además una guía escrita.',
    rulesTitle: 'Seis reglas que sigue el laboratorio',
    rules: [
      {
        lead: 'Sin esqueleto en respuestas rápidas.',
        body: 'Los marcadores solo aparecen tras 300 ms.',
      },
      {
        lead: 'Lento es tiempo, no un estado.',
        body: 'El mensaje cambia a los 3 s; Cancelar aparece a los 8 s.',
      },
      {
        lead: 'Vacío es una respuesta, no un error.',
        body: 'Nombra el filtro y ofrece una salida.',
      },
      {
        lead: 'Los fallos se explican y se pueden resolver.',
        body: 'Un ID de solicitud, un solo reintento, sin envíos duplicados.',
      },
      {
        lead: 'Sin permiso no es lo mismo que fallido.',
        body: 'Sin reintento ante un 403; explica quién puede dar acceso.',
      },
      {
        lead: 'Anunciar una vez, mover el foco lo justo.',
        body: 'Solo cuando desaparece el control que tenía el foco.',
      },
    ],
    roadmap: {
      title: 'En qué punto está el proyecto',
      goal: 'El objetivo: que el comportamiento de un panel sea más fácil de ver, oír y probar que con cualquier herramienta de desarrollo del navegador actual.',
      goalBody:
        'Las herramientas de desarrollo muestran las solicitudes y el DOM. No muestran lo que una persona espera, lo que dice un lector de pantalla ni dónde cae el foco del teclado. Este laboratorio se construye en abierto para mostrar exactamente eso, fase a fase.',
      here: 'Estás aquí',
      stages: { done: 'Hecho', now: 'Ahora', next: 'Después', later: 'Explorando' },
      phases: [
        {
          stage: 'done',
          link: { label: 'Abrir el laboratorio', path: '/lab/react/' },
          title: 'Cimientos',
          items: [
            'Una especificación escrita de seis estados de un panel, con sus tiempos',
            'Dos versiones, en React y en TypeScript sin framework, idénticas píxel a píxel',
            'Inglés, español y árabe de derecha a izquierda',
            'Pruebas automáticas en Chromium, Firefox y WebKit',
          ],
        },
        {
          stage: 'done',
          link: { label: 'Verlas lado a lado', path: '/compare/' },
          title: 'Comparación lado a lado',
          items: [
            'Las dos versiones en una sola vista, con los mismos controles',
            'Tiempo de arranque y tamaño de descarga, medidos en tu propio navegador',
          ],
        },
        {
          stage: 'now',
          link: {
            label: 'Hacer el guion de prueba',
            path: '/accessibility/screen-readers/',
          },
          title: 'Tecnologías de apoyo reales',
          items: [
            'Pruebas con NVDA, VoiceOver y TalkBack, con resultados publicados',
            'Revisión de los textos en español y árabe por hablantes nativos',
          ],
        },
        {
          stage: 'next',
          title: 'Ver el tiempo, no solo el estado',
          items: [
            'Una línea de tiempo de la solicitud que puedes recorrer: qué había en pantalla, qué se anunció y dónde estaba el foco en cada momento',
            'Exportar cualquier escenario como una prueba de Playwright lista para usar',
          ],
        },
        {
          stage: 'later',
          title: 'Trae lo tuyo',
          items: [
            'Pega la respuesta de tu propia API y mira cómo la maneja cada estado',
            'Más componentes: formularios, listas y desplazamiento infinito',
          ],
        },
      ],
      a11yLink: 'Ver el estado de accesibilidad',
      feedback: 'La aportación más útil son los comentarios sobre la especificación:',
      issueLink: 'abre una incidencia en GitHub',
    },
  },

  lab: {
    title: 'El panel, cuando algo sale mal',
    lede: 'Elige un escenario o ajusta la solicitud. Después observa la línea de estados y lo que oiría un lector de pantalla.',
    implNav: 'Implementación',
    impl: {
      react: { label: 'React', note: 'React 19 · hooks + reducer' },
      vanilla: { label: 'Vanilla', note: 'Sin framework · TypeScript' },
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
      'Combina los controles para encontrar casos límite: una solicitud lenta que luego falla, un lector con un filtro vacío, un reintento que sigue fallando. El panel sigue las mismas reglas en todas las combinaciones.',
    customA11y:
      'Mira la pestaña Lector de pantalla: cada cambio que provocas produce como mucho un anuncio por estado, nunca una cola.',
    noscript:
      'Este panel interactivo necesita JavaScript. Las guías de escenarios funcionan sin él.',
  },

  compare: {
    title: 'Dos versiones, un comportamiento',
    lede: 'El mismo panel, escrito dos veces a partir de una especificación: una con React y otra sin ningún framework. Elige un escenario y las dos lo ejecutan a la vez, aquí en tu navegador.',
    controlsHeading: 'Escenario para las dos versiones',
    replay: 'Repetir en ambas',
    listenLegend: 'Lector de pantalla y teclado en',
    listenHint:
      'Las dos versiones anuncian los cambios con regiones activas, así que un lector de pantalla oiría cada mensaje dos veces. Solo una versión a la vez es accesible con el teclado y las tecnologías de apoyo; la otra sigue visible.',
    builds: {
      react: {
        name: 'React',
        note: 'React 19, hooks y un reducer',
        frameTitle: 'Panel hecho con React',
      },
      vanilla: {
        name: 'TypeScript sin framework',
        note: 'Sin framework ni dependencias en ejecución',
        frameTitle: 'Panel hecho con TypeScript sin framework',
      },
    },
    active: 'El teclado y el lector de pantalla están en esta versión.',
    muted:
      'Solo visible: ahora no es accesible con el teclado ni con un lector de pantalla.',
    useThis: 'Usar esta versión',
    metrics: {
      label: (build: string) => `${build}: mediciones`,
      ready: 'Lista en',
      script: 'JavaScript descargado',
      steps: 'Pasos en esta ejecución',
      measuring: 'Midiendo…',
      kb: (value: string) => `${value} KB`,
      files: (count: number) =>
        `${count} ${plural.select(count) === 'one' ? 'archivo' : 'archivos'}`,
    },
    lastHeard: 'Último anuncio:',
    nothingHeard: 'ninguno todavía',
    agreement: {
      heading: '¿Se comportan igual?',
      waiting: 'Esperando a que arranquen las dos versiones.',
      agree: (steps: number) =>
        `Los mismos ${steps} ${plural.select(steps) === 'one' ? 'paso' : 'pasos'}, en el mismo orden.`,
      catching: (steps: number) =>
        `Coinciden en ${steps} ${plural.select(steps) === 'one' ? 'paso' : 'pasos'} por ahora. Una versión sigue en marcha.`,
      differ: (step: number) => `Difieren en el paso ${step}.`,
      nothing: 'nada',
      uneven:
        'Una versión aún estaba cargando cuando empezó esta ejecución, así que partieron de estados distintos. Repitiendo ambas desde el mismo punto…',
      interacted:
        'Cambiaste una versión desde dentro, así que las dos ejecuciones ya no parten del mismo punto. Repite en ambas para volver a comparar.',
      explain:
        'Un paso es cualquier cosa que una persona puede notar: una solicitud, un cambio de estado, una fase de carga, un anuncio o un movimiento del foco. El tiempo no cuenta; el orden y el contenido deben coincidir.',
    },
    measuredNote:
      'Medido en tu navegador en esta visita, con las dos versiones cargando a la vez. Las cifras cambian con el dispositivo, la red y la caché; recarga para medir de nuevo.',
    facts: {
      heading: 'Al compilar',
      caption:
        'Tamaño del código y dependencias de cada versión, contados al generar esta página.',
      measure: 'Medida',
      source: 'Líneas de código (no vacías)',
      files: 'Archivos de código',
      deps: 'Dependencias en ejecución',
      none: 'Ninguna',
      shared: (lines: string) =>
        `Las dos versiones usan además la especificación compartida: ${lines} líneas de datos, reglas, formatos y textos que ninguna repite.`,
    },
    harder: {
      heading: 'Dónde costó más cada versión',
      topic: 'Tema',
      caption: 'Lo que una versión obtiene gratis y la otra tuvo que hacer a mano.',
      items: [
        {
          topic: 'Conservar el orden y las vistas',
          react:
            'Gratis: el estado del componente sobrevive a una actualización de datos.',
          vanilla:
            'Un pequeño objeto de memoria los guarda mientras se reconstruye el cuerpo.',
        },
        {
          topic: 'Conservar el foco del teclado',
          react: 'Gratis: un botón que se vuelve a renderizar es el mismo elemento.',
          vanilla:
            'Los controles reconstruibles llevan una clave; el foco vuelve al que coincide.',
        },
        {
          topic: 'Activar a tiempo los temporizadores de carga',
          react:
            'Necesita useLayoutEffect; si no, el temporizador de 300 ms empieza un fotograma tarde.',
          vanilla: 'Se activan directamente en la misma tarea que el renderizado.',
        },
        {
          topic: 'Tamaño de descarga',
          react: 'El runtime de React es la mayor parte del paquete.',
          vanilla: 'Solo se envía el propio panel.',
        },
      ],
      logLink: 'Leer el registro completo de diferencias',
    },
  },
  inspector: {
    heading: 'Inspector',
    tablist: 'Vistas del inspector',
    tabs: { timeline: 'Línea de estados', announce: 'Lector de pantalla', focus: 'Foco' },
    clear: 'Limpiar',
    hints: {
      timeline: 'Cada solicitud, transición de estado y fase de carga, en orden.',
      announce:
        'Exactamente lo que el panel envió a sus regiones en vivo: lo que oye un usuario de lector de pantalla sin moverse.',
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
      filter: 'ajustes cambiados desde el propio panel',
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
      announce: 'Cargando los datos del panel.',
      slowTitle: 'Esto está tardando más de lo habitual.',
      slowBody: 'El servidor sigue trabajando. No hace falta recargar.',
      stalledTitle: 'Seguimos esperando al servidor.',
      stalledBody: 'Puedes seguir esperando o cancelar esta solicitud.',
      cancel: 'Cancelar solicitud',
    },
    cancelled: {
      title: 'Solicitud cancelada',
      body: 'El panel no se ha actualizado. Vuelve a cargarlo cuando quieras.',
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
      title: 'No hemos podido cargar este panel',
      body: 'El servicio de analítica no está disponible temporalmente (503). Normalmente se resuelve volviendo a intentarlo.',
      requestIdLabel: 'ID de solicitud',
      retry: 'Reintentar',
      retrying: 'Reintentando…',
      announce: 'El panel no se pudo cargar. Puedes reintentarlo.',
    },
    forbidden: {
      title: 'No tienes acceso a este panel',
      body: 'Los paneles de ingresos están limitados a finanzas y dirección. Pide a un administrador del espacio de trabajo el rol de Lector o Analista.',
      requestIdLabel: 'Referencia',
      announce: 'No tienes acceso a este panel.',
    },
    widgetRestricted: {
      title: 'Los detalles de las cuentas están restringidos',
      body: (current, required) =>
        `Tu rol de ${current} permite ver totales y tendencias. Los ingresos por cuenta requieren el rol de ${required}.`,
      currentRole: (role) => `Rol actual: ${role}`,
    },
    loaded: { announce: (plan) => `Panel actualizado: ${plan}.` },
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
        'La región del panel se marca como ocupada mientras carga. No se anuncia nada en la primera carga; un cambio que provocas se anuncia una vez al terminar.',
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
        '«Cargando los datos del panel» se anuncia una vez y la región lleva aria-busy para que los lectores de pantalla no lean contenido a medio dibujar.',
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
      what: 'El plan Legacy no tiene cuentas. El panel explica por qué está vacío y ofrece un siguiente paso.',
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
      what: 'El servidor responde con un fallo temporal. El panel lo explica con lenguaje claro, muestra un ID de solicitud y ofrece reintentar.',
      why: 'Los fallos temporales son habituales y suelen recuperarse. Un mensaje claro y una única acción evidente resuelven la mayoría de sesiones sin soporte.',
      accessibility:
        'El fallo se anuncia. Mientras se reintenta, el foco se queda en el botón Reintentar; cuando funciona y el botón desaparece, el foco pasa al encabezado del panel para no perderse nunca.',
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
      summary: 'El visitante no tiene acceso a este panel.',
      what: 'El servidor responde con un 403. En lugar de un error, el panel explica quién puede dar acceso. No hay botón de reintentar, porque reintentar no ayuda.',
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
    readGuide: 'Leer la guía',
    position: (index: number, total: number) => `Escenario ${index} de ${total}`,
    settingsTitle: 'Ajustes del laboratorio',
    allScenarios: 'Todos los escenarios',
    previous: 'Anterior',
    next: 'Siguiente',
    more: 'Más escenarios',
  },

  accessibilityPage: {
    title: 'Accesibilidad',
    lede: 'Esta página dice qué se ha probado y cómo. Las comprobaciones automáticas solo detectan una parte de lo que importa, así que aquí nada se califica de «accesible» hasta haberlo probado con tecnologías de apoyo reales.',
    scriptBody:
      'Para las pruebas manuales hay un guion paso a paso con las palabras exactas que debe producir cada escenario.',
    scriptLink: 'Abrir el guion de prueba con lector de pantalla',
    matrixTitle: 'Matriz de pruebas',
    updated: (date) => `Última actualización: ${date}`,
    check: 'Comprobación',
    status: 'Estado',
    rows: [
      {
        check: 'axe-core en cada escenario y en los tres idiomas (automático)',
        status: 'Automatizado en CI',
      },
      {
        check:
          'Lo que debe decir un lector de pantalla, en las dos versiones y los tres idiomas (automático)',
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
      'En pantallas estrechas el gráfico se reduce y las etiquetas de los ejes quedan pequeñas; la vista «Ver datos como tabla» es la alternativa legible hasta que llegue un diseño para pantallas estrechas.',
      'Las traducciones al español y al árabe las redactó el autor y aún no las ha revisado un hablante nativo.',
    ],
    reportTitle: 'Informar de un problema',
    reportBody:
      'Si algo no funciona con tu configuración, abre una incidencia e indica tu navegador, idioma y tecnología de apoyo.',
    reportLink: 'Abrir una incidencia',
  },

  screenReaders: {
    title: 'Guion de prueba con lector de pantalla',
    lede: 'Las pruebas automáticas demuestran que el panel dice lo que dice la especificación. Solo una persona con un lector de pantalla real puede saber si se oye de forma clara y agradable. Este es el guion para esa prueba: qué hacer, qué deberías oír y los resultados hasta ahora.',
    verified:
      'Lo que deberías oír en esta página se calcula a partir de la especificación, no se escribe a mano. En cada cambio, las dos versiones se comprueban contra ello en Chromium, Firefox y WebKit, en los tres idiomas, incluidos los tiempos.',
    howTitle: 'Cómo hacerla',
    how: [
      'Abre uno de los enlaces de escenario y activa tu lector de pantalla.',
      'Ve al encabezado del panel y haz cada paso sin mover el foco por tu cuenta.',
      'Escucha las mismas palabras en el mismo orden. Los lectores añaden roles y estados, como «encabezado de nivel 2»; es lo esperado.',
      'Los mensajes «educados» esperan a que el lector termine lo que está diciendo. Los «urgentes» lo interrumpen.',
      'Anota lo que oíste en el formulario de resultados, también cuando todo salió bien.',
    ],
    setupsTitle: 'Configuraciones que cubrir',
    setups: {
      nvdaFirefox: 'NVDA con Firefox en Windows',
      voiceoverMac: 'VoiceOver con Safari en macOS',
      voiceoverIos: 'VoiceOver con Safari en iPhone',
      talkback: 'TalkBack con Chrome en Android',
    },
    scenariosTitle: 'El guion',
    openIn: 'Abrir en:',
    stepLabel: (step: number) => `Paso ${step}`,
    actions: {
      open: 'Abre el enlace y espera.',
      replay: (label: string) => `Pulsa «${label}» en los controles del laboratorio.`,
      retry: (label: string) => `Pulsa «${label}».`,
      cancel: (label: string) => `Cuando aparezca «${label}», púlsalo.`,
      showAllPlans: (label: string) => `Pulsa «${label}».`,
    },
    expectLabel: 'Deberías oír:',
    silence: 'Nada. Aquí lo correcto es el silencio.',
    after: (time: string) => `a los ${time}`,
    politeness: { polite: 'educado', assertive: 'urgente' },
    focusMoves: (target: string) => `El foco pasa a ${target}.`,
    resultsTitle: 'Resultados hasta ahora',
    resultsCaption:
      'Último resultado de cada configuración y escenario. Cada prueba queda registrada en el repositorio con versiones y notas.',
    setupColumn: 'Configuración',
    outcomes: {
      pass: 'Bien',
      partial: 'En parte',
      fail: 'Mal',
      untested: 'Sin probar aún',
    },
    noRuns:
      'Nadie ha hecho aún el guion con un lector de pantalla real. Esas primeras pruebas son la fase actual del proyecto.',
    submit: 'Enviar un resultado',
    reviewTitle: 'Revisión del español y del árabe',
    reviewBody:
      'El autor redactó los textos en español y árabe, y aún necesitan la revisión de hablantes nativos. Si algo suena mal, propón una redacción mejor; cada sugerencia aceptada se reconoce.',
    reviewLink: 'Proponer una corrección',
  },
  notFound: {
    eyebrow: '404',
    title: 'Un estado vacío propio',
    lede: 'La solicitud funcionó, pero no hay nada en esta dirección.',
    back: 'Volver al laboratorio',
  },
};
