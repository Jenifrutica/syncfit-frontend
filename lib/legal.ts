/**
 * Legal texts (privacy policy, terms of use) in ES, EN and ZH. Spanish is the
 * reference version. Facts here mirror the code: what the backend stores,
 * what syncfit-ai-reasoning sends to the AI provider, and that deleting the
 * account hard-deletes its data (syncfit-backend app/services/admin.py).
 */

import type { Language } from "@/lib/i18n";

export type LegalSection = { titulo: string; parrafos: string[]; lista?: string[] };
export type LegalDoc = { titulo: string; actualizado: string; intro: string; secciones: LegalSection[] };

/** Public channel to reach the team (the project's GitHub organization). */
export const CONTACTO = "https://github.com/Jenifrutica";

export const PRIVACIDAD: Record<Language, LegalDoc> = {
  ES: {
    titulo: "Política de privacidad",
    actualizado: "Última actualización: 19 de noviembre de 2026",
    intro:
      "SyncFit Edge es un proyecto académico que ajusta tu entrenamiento a tu ciclo o a tu embarazo. Para eso trata datos personales, algunos de salud. Aquí te contamos cuáles, para qué y cómo puedes controlarlos, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.",
    secciones: [
      {
        titulo: "Quién es responsable",
        parrafos: [
          `El responsable del tratamiento es el equipo de estudiantes que desarrolla SyncFit Edge como proyecto académico. Puedes contactarnos por el canal público del proyecto: ${CONTACTO}.`,
        ],
      },
      {
        titulo: "Qué datos tratamos",
        parrafos: ["Solo los que la app necesita para funcionar:"],
        lista: [
          "Cuenta: nombre, correo, número de documento y contraseña (guardada cifrada, nunca en texto plano).",
          "Perfil: edad, peso, estatura, porcentaje de grasa, objetivo, modalidad (ciclo o embarazo), fechas del ciclo o semana de gestación, síntomas, nivel de dolor, notas, suplementos, cargas y una foto si decides subirla.",
          "Sensores: variabilidad del pulso, temperatura de la piel y fuerza, tomados en la estación de check-in.",
          "Uso: rutinas generadas, sesiones de entrenamiento, registros de energía y gimnasios a los que te unes.",
          "Si administras un gimnasio: sus datos, máquinas y fotos.",
        ],
      },
      {
        titulo: "Datos sensibles",
        parrafos: [
          "Los datos de salud, del ciclo menstrual y del embarazo son datos sensibles. No estás obligada a darlos: puedes dejar campos vacíos, aunque la rutina se adaptará menos. Al registrarlos nos autorizas a usarlos únicamente para personalizar tu entrenamiento y tu nutrición dentro de la app.",
        ],
      },
      {
        titulo: "Para qué los usamos",
        parrafos: [
          "Para crear y ajustar tus rutinas, mostrar tu calendario, tus macros y tu progreso, proteger tu cuenta y compartir tu perfil solo cuando tú creas un enlace. No vendemos tus datos ni los usamos para publicidad.",
        ],
      },
      {
        titulo: "Con quién se comparten",
        parrafos: ["Solo con quienes hacen posible el servicio:"],
        lista: [
          "Proveedor de inteligencia artificial (DeepSeek, con GPT-6 Luna como respaldo): recibe el contexto de entrenamiento —fase, evaluación de los sensores, síntomas y notas que escribas, y las máquinas del gimnasio— sin tu nombre, correo ni documento.",
          "Amazon Web Services: aloja la app y envía los correos de recuperación de contraseña.",
          "Google: solo si eliges iniciar sesión con Google.",
          "Las personas a quienes tú les compartes un enlace, con lo que elegiste mostrar.",
          "El equipo administrador del proyecto, que puede ver los datos de tu cuenta para darte soporte.",
        ],
      },
      {
        titulo: "Cómo los protegemos",
        parrafos: [
          "La conexión va cifrada (HTTPS) y la contraseña se transforma en tu navegador antes de enviarse y se guarda con un algoritmo de hash. Tu sesión, el idioma y algunas preferencias se guardan en el almacenamiento local de tu navegador; no usamos cookies de publicidad ni de seguimiento.",
        ],
      },
      {
        titulo: "Tus derechos",
        parrafos: [
          "Puedes conocer, actualizar y corregir tus datos desde tu perfil, revocar esta autorización y pedir que los borremos. Para borrar todo, entra a Perfil → Cuenta → Eliminar cuenta. Si no estás conforme con nuestra respuesta, puedes acudir a la Superintendencia de Industria y Comercio.",
        ],
      },
      {
        titulo: "Cuánto tiempo los guardamos",
        parrafos: [
          "Mientras tengas tu cuenta. Al eliminarla se borran de forma definitiva tu cuenta, tu perfil, tus rutinas, tus sesiones con sus datos de sensores, tus registros y tus enlaces compartidos. Cuando termine el proyecto académico, los datos se eliminarán.",
        ],
      },
      {
        titulo: "Menores de edad",
        parrafos: ["SyncFit Edge está pensado para personas mayores de edad. Si eres menor, úsalo solo con la autorización de tu madre, padre o representante legal."],
      },
      {
        titulo: "Cambios",
        parrafos: ["Si cambiamos esta política, actualizaremos la fecha de arriba y te lo contaremos en la app."],
      },
    ],
  },
  EN: {
    titulo: "Privacy policy",
    actualizado: "Last updated: November 19, 2026",
    intro:
      "SyncFit Edge is an academic project that adapts your training to your cycle or pregnancy. To do that it processes personal data, some of it about your health. Here is which data, why, and how you control it, under Colombian Law 1581 of 2012 and Decree 1377 of 2013. The Spanish version prevails.",
    secciones: [
      { titulo: "Who is responsible", parrafos: [`The data controller is the student team that builds SyncFit Edge as an academic project. You can reach us through the project's public channel: ${CONTACTO}.`] },
      {
        titulo: "What data we process",
        parrafos: ["Only what the app needs to work:"],
        lista: [
          "Account: name, email, ID number and password (stored hashed, never in plain text).",
          "Profile: age, weight, height, body fat, goal, mode (cycle or pregnancy), cycle dates or pregnancy week, symptoms, pain level, notes, supplements, loads and a photo if you upload one.",
          "Sensors: heart rate variability, skin temperature and strength, taken at the check-in station.",
          "Usage: generated routines, workout sessions, energy logs and the gyms you join.",
          "If you run a gym: its details, machines and photos.",
        ],
      },
      { titulo: "Sensitive data", parrafos: ["Health, menstrual cycle and pregnancy data are sensitive. You don't have to provide them: you can leave fields empty, though the routine will adapt less. By entering them you authorize us to use them only to personalize your training and nutrition in the app."] },
      { titulo: "What we use it for", parrafos: ["To build and adjust your routines, show your calendar, macros and progress, protect your account, and share your profile only when you create a link. We don't sell your data or use it for advertising."] },
      {
        titulo: "Who we share it with",
        parrafos: ["Only those who make the service possible:"],
        lista: [
          "AI provider (DeepSeek, with GPT-6 Luna as backup): receives the training context —phase, sensor assessment, symptoms and notes you write, and the gym's machines— without your name, email or ID.",
          "Amazon Web Services: hosts the app and sends password-reset emails.",
          "Google: only if you choose to sign in with Google.",
          "People you share a link with, limited to what you chose to show.",
          "The project's admin team, who can see your account details to support you.",
        ],
      },
      { titulo: "How we protect it", parrafos: ["The connection is encrypted (HTTPS); your password is transformed in your browser before it is sent and stored with a hashing algorithm. Your session, language and some preferences live in your browser's local storage; we don't use advertising or tracking cookies."] },
      { titulo: "Your rights", parrafos: ["You can see, update and correct your data from your profile, withdraw this authorization and ask us to delete it. To delete everything, go to Profile → Account → Delete account. If you're not satisfied with our answer, you can contact Colombia's Superintendence of Industry and Commerce (SIC)."] },
      { titulo: "How long we keep it", parrafos: ["As long as you keep your account. Deleting it permanently removes your account, profile, routines, sessions with their sensor data, logs and share links. When the academic project ends, the data will be deleted."] },
      { titulo: "Minors", parrafos: ["SyncFit Edge is meant for adults. If you're a minor, use it only with your parent's or legal guardian's permission."] },
      { titulo: "Changes", parrafos: ["If we change this policy, we'll update the date above and let you know in the app."] },
    ],
  },
  ZH: {
    titulo: "隐私政策",
    actualizado: "最后更新：2026 年 11 月 19 日",
    intro:
      "SyncFit Edge 是一个学术项目，根据你的月经周期或孕期调整训练。为此我们会处理个人数据，其中一些与健康有关。本文说明处理哪些数据、用途以及你如何控制它们，依据哥伦比亚 2012 年第 1581 号法律和 2013 年第 1377 号法令。以西班牙语版本为准。",
    secciones: [
      { titulo: "责任方", parrafos: [`数据控制者是将 SyncFit Edge 作为学术项目开发的学生团队。你可以通过项目的公开渠道联系我们：${CONTACTO}。`] },
      {
        titulo: "我们处理哪些数据",
        parrafos: ["仅限应用运行所需："],
        lista: [
          "账户：姓名、邮箱、证件号码和密码（以哈希形式保存，绝不存储明文）。",
          "资料：年龄、体重、身高、体脂率、目标、模式（周期或孕期）、周期日期或孕周、症状、疼痛程度、备注、补充剂、负重，以及你选择上传的照片。",
          "传感器：在签到站测得的心率变异性、皮肤温度和力量。",
          "使用记录：生成的训练、训练记录、精力记录和你加入的健身房。",
          "如果你管理健身房：健身房信息、器械和照片。",
        ],
      },
      { titulo: "敏感数据", parrafos: ["健康、月经周期和孕期数据属于敏感数据。你不必提供：可以留空，但训练的个性化程度会降低。填写即表示你授权我们仅将其用于在应用内个性化你的训练和营养。"] },
      { titulo: "用途", parrafos: ["用于生成和调整训练、显示日历、宏量营养和进度、保护账户，以及仅在你创建链接时分享你的资料。我们不会出售你的数据，也不会用于广告。"] },
      {
        titulo: "与谁共享",
        parrafos: ["仅与提供服务所必需的各方："],
        lista: [
          "人工智能服务商（DeepSeek，备用为 GPT-6 Luna）：接收训练相关信息——阶段、传感器评估、你填写的症状和备注、健身房器械——不包含你的姓名、邮箱或证件号码。",
          "Amazon Web Services：托管应用并发送重置密码邮件。",
          "Google：仅当你选择用 Google 登录时。",
          "你分享链接的对象，仅限你选择展示的内容。",
          "项目管理团队：为提供支持可查看你的账户信息。",
        ],
      },
      { titulo: "如何保护", parrafos: ["连接经过加密（HTTPS）；密码在浏览器中转换后再发送，并以哈希算法保存。你的会话、语言和部分偏好保存在浏览器本地存储中；我们不使用广告或跟踪 Cookie。"] },
      { titulo: "你的权利", parrafos: ["你可以在个人资料中查看、更新和更正数据，撤回授权并要求删除。要删除全部数据，请进入 个人资料 → 账户 → 删除账户。如对我们的答复不满意，可向哥伦比亚工业和商业监管局（SIC）投诉。"] },
      { titulo: "保存期限", parrafos: ["在你保留账户期间保存。删除账户会永久删除你的账户、资料、训练、带传感器数据的训练记录、各类记录和分享链接。学术项目结束时，数据将被删除。"] },
      { titulo: "未成年人", parrafos: ["SyncFit Edge 面向成年人。未成年人须在父母或法定监护人同意下使用。"] },
      { titulo: "变更", parrafos: ["如果我们修改本政策，会更新上方日期并在应用中通知你。"] },
    ],
  },
};

export const TERMINOS: Record<Language, LegalDoc> = {
  ES: {
    titulo: "Términos de uso",
    actualizado: "Última actualización: 19 de noviembre de 2026",
    intro: "Al crear una cuenta o usar SyncFit Edge aceptas estos términos. Son cortos y en lenguaje claro; léelos junto con nuestra Política de privacidad.",
    secciones: [
      { titulo: "Qué es SyncFit Edge", parrafos: ["Un proyecto académico que propone rutinas de entrenamiento según tu fase del ciclo o tu semana de embarazo, tus sensores y el equipo de tu gimnasio. Es una versión de evaluación, no un servicio comercial."] },
      {
        titulo: "No es consejo médico",
        parrafos: ["Las rutinas y las sugerencias de nutrición son orientativas y no reemplazan la valoración de tu médico, tu ginecólogo ni tu entrenador. Si estás embarazada, tienes una condición de salud o sientes dolor, mareo o algo fuera de lo normal, detente y consulta a un profesional."],
      },
      { titulo: "Rutinas generadas automáticamente", parrafos: ["Las propone un motor que combina reglas fijas y un modelo de inteligencia artificial. Un validador bloquea los ejercicios contraindicados que conoce, pero puede haber errores: revisa siempre la rutina, ajusta el peso a lo que puedes hacer con buena técnica y usa tu criterio."] },
      { titulo: "Tu cuenta", parrafos: ["Da datos verdaderos, usa una contraseña segura y no la compartas. Eres responsable de lo que se haga con tu cuenta. Puedes eliminarla cuando quieras desde Perfil → Cuenta."] },
      {
        titulo: "Uso permitido",
        parrafos: ["No puedes:"],
        lista: [
          "Hacerte pasar por otra persona ni usar documentos ajenos.",
          "Intentar acceder a cuentas, datos o partes del sistema que no te corresponden.",
          "Sobrecargar o atacar el servicio, ni automatizar su uso sin permiso.",
          "Subir fotos o textos ilegales, ofensivos o sobre los que no tengas derechos.",
        ],
      },
      { titulo: "Gimnasios", parrafos: ["Si administras un gimnasio, eres responsable de que la información y las fotos de tus máquinas sean correctas y de que tengas permiso para publicarlas. Tus atletas reciben rutinas basadas en ese inventario."] },
      { titulo: "Propiedad intelectual", parrafos: ["El software, los diseños y la mascota Pulsi pertenecen a sus autores, con todos los derechos reservados. Las fotos y los textos que subas siguen siendo tuyos; nos das permiso para guardarlos y mostrarlos dentro de la app mientras tengas tu cuenta."] },
      { titulo: "Disponibilidad", parrafos: ["Al ser un proyecto académico, el servicio se ofrece tal como está, puede tener interrupciones o cambios y puede cerrarse cuando termine el proyecto. Podemos desactivar cuentas que incumplan estos términos."] },
      { titulo: "Ley aplicable", parrafos: ["Estos términos se rigen por las leyes de la República de Colombia."] },
      { titulo: "Contacto", parrafos: [`Para dudas o solicitudes, escríbenos por el canal público del proyecto: ${CONTACTO}.`] },
    ],
  },
  EN: {
    titulo: "Terms of use",
    actualizado: "Last updated: November 19, 2026",
    intro: "By creating an account or using SyncFit Edge you accept these terms. They're short and plain; read them with our Privacy policy. The Spanish version prevails.",
    secciones: [
      { titulo: "What SyncFit Edge is", parrafos: ["An academic project that suggests training routines based on your cycle phase or pregnancy week, your sensors and your gym's equipment. It's an evaluation version, not a commercial service."] },
      { titulo: "Not medical advice", parrafos: ["Routines and nutrition suggestions are guidance and don't replace advice from your doctor, gynecologist or coach. If you're pregnant, have a health condition or feel pain, dizziness or anything unusual, stop and see a professional."] },
      { titulo: "Automatically generated routines", parrafos: ["They come from an engine that combines fixed rules and an AI model. A validator blocks the contraindicated exercises it knows, but mistakes can happen: always review the routine, set weights you can lift with good form and use your judgment."] },
      { titulo: "Your account", parrafos: ["Give true information, use a strong password and don't share it. You're responsible for what's done with your account. You can delete it anytime from Profile → Account."] },
      {
        titulo: "Acceptable use",
        parrafos: ["You may not:"],
        lista: [
          "Impersonate someone or use another person's ID.",
          "Try to access accounts, data or parts of the system that aren't yours.",
          "Overload or attack the service, or automate it without permission.",
          "Upload illegal or offensive photos or text, or content you have no rights to.",
        ],
      },
      { titulo: "Gyms", parrafos: ["If you run a gym, you're responsible for your machines' information and photos being accurate and for having permission to publish them. Your athletes get routines based on that inventory."] },
      { titulo: "Intellectual property", parrafos: ["The software, designs and the Pulsi mascot belong to their authors, all rights reserved. Photos and text you upload remain yours; you allow us to store and show them in the app while you keep your account."] },
      { titulo: "Availability", parrafos: ["As an academic project, the service is provided as is, may have outages or changes and may close when the project ends. We may deactivate accounts that break these terms."] },
      { titulo: "Governing law", parrafos: ["These terms are governed by the laws of the Republic of Colombia."] },
      { titulo: "Contact", parrafos: [`For questions or requests, reach us through the project's public channel: ${CONTACTO}.`] },
    ],
  },
  ZH: {
    titulo: "使用条款",
    actualizado: "最后更新：2026 年 11 月 19 日",
    intro: "创建账户或使用 SyncFit Edge 即表示你接受这些条款。条款简短易懂，请与我们的隐私政策一起阅读。以西班牙语版本为准。",
    secciones: [
      { titulo: "SyncFit Edge 是什么", parrafos: ["一个学术项目，根据你的周期阶段或孕周、传感器数据和健身房器械推荐训练。这是评估版本，并非商业服务。"] },
      { titulo: "不构成医疗建议", parrafos: ["训练和营养建议仅供参考，不能代替医生、妇科医生或教练的意见。如果你怀孕、有健康问题，或感到疼痛、头晕或其他异常，请停止并咨询专业人士。"] },
      { titulo: "自动生成的训练", parrafos: ["训练由结合固定规则和人工智能模型的引擎生成。校验器会屏蔽已知的不适合动作，但仍可能出错：请务必检查训练内容，选择能以正确姿势完成的重量，并自行判断。"] },
      { titulo: "你的账户", parrafos: ["请提供真实信息，使用安全的密码并不要与他人共享。你需对账户内的行为负责。你可以随时在 个人资料 → 账户 中删除账户。"] },
      {
        titulo: "允许的使用",
        parrafos: ["你不得："],
        lista: ["冒充他人或使用他人的证件。", "试图访问不属于你的账户、数据或系统部分。", "使服务过载或攻击服务，或未经许可自动化使用。", "上传违法、冒犯性或你无权使用的照片或文字。"],
      },
      { titulo: "健身房", parrafos: ["如果你管理健身房，你需确保器械信息和照片准确，并有权发布。你的运动员会根据该器械清单获得训练。"] },
      { titulo: "知识产权", parrafos: ["软件、设计和吉祥物 Pulsi 归作者所有，保留所有权利。你上传的照片和文字仍归你所有；在你保留账户期间，你允许我们在应用内保存和展示它们。"] },
      { titulo: "可用性", parrafos: ["作为学术项目，服务按现状提供，可能中断或变更，并可能在项目结束时关闭。我们可以停用违反这些条款的账户。"] },
      { titulo: "适用法律", parrafos: ["本条款受哥伦比亚共和国法律管辖。"] },
      { titulo: "联系方式", parrafos: [`如有疑问或请求，请通过项目的公开渠道联系我们：${CONTACTO}。`] },
    ],
  },
};
