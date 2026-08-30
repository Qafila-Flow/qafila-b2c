/**
 * Privacy policy and terms content.
 *
 * Kept out of `messages/*.json` on purpose - those files are UI strings that
 * translators edit, and several thousand words of legal prose makes both jobs
 * harder. Google's verification fetcher reads these pages, so they render
 * server-side rather than through the client i18n provider.
 */

export interface LegalSection {
  heading: string;
  body?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  updatedLabel: string;
  intro: string[];
  sections: LegalSection[];
}

export const COMPANY = {
  email: "info@qafila.com.sa",
  phone: "+966 53 970 0630",
  vat: "314526354100003",
  addressEn: "Riyadh, Kingdom of Saudi Arabia",
  addressAr: "الرياض، المملكة العربية السعودية",
  site: "qafila.com.sa",
} as const;

const UPDATED_EN = "30 August 2026";
const UPDATED_AR = "30 أغسطس 2026";

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  updatedLabel: `Last updated: ${UPDATED_EN}`,
  intro: [
    `This policy explains what personal data Qafila collects when you use ${COMPANY.site}, why we collect it, who we share it with, and the choices you have.`,
    `Qafila is a multi-vendor marketplace based in ${COMPANY.addressEn}, and is the controller of the personal data described here. Our VAT registration number is ${COMPANY.vat}.`,
  ],
  sections: [
    {
      heading: "Information we collect",
      body: [
        "We collect only what we need to run an account, take an order and deliver it.",
      ],
      bullets: [
        "Account details. Your mobile number, and your first name, last name and email address where you provide them. We sign you in with a one-time password sent to your phone, so we never ask you to create a password and we do not store one.",
        "Google sign-in details. If you choose to continue with Google, Google sends us your Google account identifier, your verified email address and your first and last name. We never receive your Google password, and we request no access to your Gmail, Drive, contacts, calendar or any other Google service.",
        "Order and delivery details. Delivery addresses, the recipient name and phone number on each address, and the contents, status and history of your orders.",
        "Payment details. Card and instalment payments are processed by licensed payment providers. We receive a payment reference, the amount, the status and, for cards, the brand and last digits. We never receive or store your full card number or its security code.",
        "Notification details. If you allow browser or device notifications, our notification provider assigns a device token so we can send you order updates.",
        "Activity on the site. Products you view, your cart and wishlist, reviews and ratings you post, and support messages you send us.",
        "Technical details. IP address, browser and device type, and general log data used to keep the service secure and working.",
      ],
    },
    {
      heading: "How we use your information",
      bullets: [
        "To create and secure your account, and to sign you in.",
        "To process, fulfil and deliver your orders, including passing delivery details to the vendor fulfilling them.",
        "To take payment, issue invoices and handle refunds.",
        "To provide customer support and respond to your messages.",
        "To send service messages about your orders, and marketing messages only where you have opted in. You can turn marketing off at any time.",
        "To show relevant products and recommendations.",
        "To detect and prevent fraud, abuse and security incidents.",
        "To meet our legal, tax and accounting obligations in the Kingdom of Saudi Arabia.",
      ],
    },
    {
      heading: "How we use data received from Google",
      body: [
        "If you sign in with Google, we use the information Google gives us for one purpose: to identify your Qafila account and sign you in.",
        "Your verified email address is used to match you to an existing Qafila account or to create one, so that signing in with Google and signing in with your phone number lead to the same account rather than two. Your name is used to fill in your profile so you do not have to type it again.",
        "We do not sell this information, we do not use it for advertising, and we do not transfer it to anyone except the service providers described below who help us operate the site. You can disconnect Qafila from your Google account at any time in your Google account settings.",
      ],
    },
    {
      heading: "Who we share your information with",
      body: ["We do not sell your personal data. We share it only as follows:"],
      bullets: [
        "Vendors. When you place an order, the vendor fulfilling it receives the delivery name, address, phone number and the items ordered so they can pack and ship it. They receive nothing else about you.",
        "Payment providers. Card and instalment payments are processed by licensed providers, and their own privacy terms apply to that processing.",
        "Delivery partners. The carrier delivering your order receives the delivery address and contact number.",
        "Service providers. Companies that host our systems, store our files, send our notifications and help us with analytics, acting on our instructions and only for those purposes.",
        "Authorities. Where we are required to disclose information by Saudi law, a court order or a lawful request from a competent authority.",
        "Business transfer. If Qafila is involved in a merger, acquisition or sale of assets, your data may transfer with the business. We will tell you before that happens.",
      ],
    },
    {
      heading: "Cookies and local storage",
      body: [
        "We use cookies and your browser local storage to keep you signed in, remember your cart, wishlist, language and light or dark theme preference, and to understand how the site is used so we can improve it.",
        "You can clear or block these in your browser settings. Blocking them will sign you out and may stop parts of the site working.",
      ],
    },
    {
      heading: "How long we keep your data",
      body: [
        "We keep your account data for as long as your account is open. Order, invoice and payment records are kept for as long as Saudi tax and commercial law requires, even if you close your account.",
        "When data is no longer needed for either purpose, we delete it or make it permanently anonymous.",
      ],
    },
    {
      heading: "Security",
      body: [
        "Your data is stored on servers located in the Kingdom of Saudi Arabia. Traffic between your browser and our systems is encrypted in transit, access to production systems is restricted to staff who need it, and payment card data never reaches our servers.",
        "No system is perfectly secure. If a breach affects your personal data, we will notify you and the competent authority as the law requires.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under the Saudi Personal Data Protection Law you have the right to:",
      ],
      bullets: [
        "Be informed about how your data is collected and used, which is the purpose of this policy.",
        "Request a copy of the personal data we hold about you.",
        "Ask us to correct data that is wrong or incomplete. You can edit most of it yourself in your profile.",
        "Ask us to delete your data, subject to records we are legally required to keep.",
        "Withdraw consent to processing that relies on consent, including marketing messages and push notifications.",
      ],
    },
    {
      heading: "Exercising your rights",
      body: [
        `To make any of these requests, email ${COMPANY.email} or call ${COMPANY.phone}. We will respond within thirty days. We may ask you to confirm your identity first, so that nobody else can obtain or delete your data.`,
        "If you are not satisfied with our response, you may complain to the Saudi Data and Artificial Intelligence Authority.",
      ],
    },
    {
      heading: "Children",
      body: [
        "Qafila is not intended for children under the age of eighteen, and we do not knowingly collect their personal data. If you believe a child has given us their data, contact us and we will delete it.",
      ],
    },
    {
      heading: "Transfers outside the Kingdom",
      body: [
        "Some service providers we rely on, such as our sign-in and notification providers, operate outside the Kingdom of Saudi Arabia. Where your data is transferred abroad, we do so only as the Personal Data Protection Law permits and only with providers that offer an adequate level of protection.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "We may update this policy as the service changes or the law requires. The date at the top shows when it last changed. If a change materially affects your rights, we will tell you on the site or by message before it takes effect.",
      ],
    },
    {
      heading: "Contact us",
      body: [
        `Questions about this policy or about your data can go to ${COMPANY.email}, or by phone to ${COMPANY.phone}. Our address is ${COMPANY.addressEn}.`,
      ],
    },
  ],
};

const privacyAr: LegalDoc = {
  title: "سياسة الخصوصية",
  updatedLabel: `آخر تحديث: ${UPDATED_AR}`,
  intro: [
    `توضح هذه السياسة البيانات الشخصية التي تجمعها قافلة عند استخدامك لموقع ${COMPANY.site}، ولماذا نجمعها، ومع من نشاركها، وما هي الخيارات المتاحة لك.`,
    `قافلة سوق إلكتروني متعدد البائعين مقره ${COMPANY.addressAr}، وهو الجهة المتحكمة في البيانات الشخصية الموضحة هنا. الرقم الضريبي للمنشأة هو ${COMPANY.vat}.`,
  ],
  sections: [
    {
      heading: "البيانات التي نجمعها",
      body: [
        "نجمع فقط ما نحتاجه لإدارة حسابك واستلام طلبك وتوصيله.",
      ],
      bullets: [
        "بيانات الحساب: رقم جوالك، والاسم الأول واسم العائلة والبريد الإلكتروني عند تزويدنا بها. ندخلك إلى حسابك عبر رمز تحقق يُرسل إلى جوالك، لذلك لا نطلب منك إنشاء كلمة مرور ولا نحتفظ بأي كلمة مرور.",
        "بيانات الدخول عبر جوجل: عند اختيارك المتابعة باستخدام جوجل، ترسل لنا جوجل معرّف حسابك وبريدك الإلكتروني الموثّق واسمك الأول واسم العائلة. لا نستلم كلمة مرور حساب جوجل الخاص بك، ولا نطلب أي صلاحية للوصول إلى بريد Gmail أو Drive أو جهات الاتصال أو التقويم أو أي خدمة أخرى من خدمات جوجل.",
        "بيانات الطلب والتوصيل: عناوين التوصيل، واسم ورقم جوال المستلم لكل عنوان، ومحتويات طلباتك وحالتها وسجلها.",
        "بيانات الدفع: تُعالَج مدفوعات البطاقات والتقسيط لدى مزودي دفع مرخصين. نستلم مرجع العملية والمبلغ والحالة، وللبطاقات نوعها وآخر أرقامها. لا نستلم ولا نخزّن رقم بطاقتك كاملاً أو رمز التحقق الخاص بها.",
        "بيانات الإشعارات: إذا سمحت بإشعارات المتصفح أو الجهاز، يُخصّص مزود الإشعارات رمزاً للجهاز حتى نتمكن من إرسال تحديثات طلباتك.",
        "نشاطك على الموقع: المنتجات التي تتصفحها، وسلتك وقائمة أمنياتك، والتقييمات والمراجعات التي تنشرها، ورسائل الدعم التي ترسلها لنا.",
        "بيانات تقنية: عنوان IP ونوع المتصفح والجهاز وسجلات عامة تُستخدم للحفاظ على أمان الخدمة وعملها.",
      ],
    },
    {
      heading: "كيف نستخدم بياناتك",
      bullets: [
        "لإنشاء حسابك وتأمينه وتسجيل دخولك.",
        "لمعالجة طلباتك وتجهيزها وتوصيلها، بما في ذلك تزويد البائع المنفّذ ببيانات التوصيل.",
        "لتحصيل المدفوعات وإصدار الفواتير ومعالجة الاسترجاع.",
        "لتقديم خدمة العملاء والرد على رسائلك.",
        "لإرسال رسائل الخدمة المتعلقة بطلباتك، والرسائل التسويقية فقط إذا وافقت عليها. يمكنك إيقاف الرسائل التسويقية في أي وقت.",
        "لعرض منتجات وتوصيات مناسبة لك.",
        "لاكتشاف الاحتيال وإساءة الاستخدام والحوادث الأمنية ومنعها.",
        "للوفاء بالتزاماتنا النظامية والضريبية والمحاسبية في المملكة العربية السعودية.",
      ],
    },
    {
      heading: "كيف نستخدم البيانات الواردة من جوجل",
      body: [
        "عند تسجيل الدخول باستخدام جوجل، نستخدم المعلومات التي تزودنا بها جوجل لغرض واحد فقط: تحديد حسابك في قافلة وتسجيل دخولك.",
        "يُستخدم بريدك الإلكتروني الموثّق لمطابقتك بحساب قائم في قافلة أو لإنشاء حساب جديد، بحيث يؤدي الدخول عبر جوجل والدخول عبر رقم الجوال إلى الحساب نفسه لا إلى حسابين. ويُستخدم اسمك لتعبئة ملفك الشخصي دون الحاجة إلى كتابته مرة أخرى.",
        "لا نبيع هذه المعلومات، ولا نستخدمها لأغراض إعلانية، ولا ننقلها لأي جهة عدا مزودي الخدمة الموضحين أدناه الذين يساعدوننا في تشغيل الموقع. ويمكنك فصل قافلة عن حساب جوجل الخاص بك في أي وقت من إعدادات حسابك في جوجل.",
      ],
    },
    {
      heading: "مع من نشارك بياناتك",
      body: ["لا نبيع بياناتك الشخصية. ولا نشاركها إلا في الحالات التالية:"],
      bullets: [
        "البائعون: عند تقديمك طلباً، يستلم البائع المنفّذ اسم المستلم وعنوانه ورقم جواله والأصناف المطلوبة ليتمكن من تجهيز الطلب وشحنه. ولا يستلم أي بيانات أخرى عنك.",
        "مزودو الدفع: تُعالَج مدفوعات البطاقات والتقسيط لدى مزودين مرخصين، وتسري شروط الخصوصية الخاصة بهم على تلك المعالجة.",
        "شركاء التوصيل: تستلم شركة الشحن التي توصل طلبك عنوان التوصيل ورقم التواصل.",
        "مزودو الخدمة: الشركات التي تستضيف أنظمتنا وتخزّن ملفاتنا وترسل إشعاراتنا وتساعدنا في التحليلات، وذلك وفق تعليماتنا ولهذه الأغراض فقط.",
        "الجهات المختصة: عندما يُطلب منا الإفصاح بموجب الأنظمة السعودية أو أمر قضائي أو طلب نظامي من جهة مختصة.",
        "نقل النشاط التجاري: إذا دخلت قافلة في عملية اندماج أو استحواذ أو بيع أصول، فقد تُنقل بياناتك مع النشاط. وسنخبرك قبل حدوث ذلك.",
      ],
    },
    {
      heading: "ملفات الارتباط والتخزين المحلي",
      body: [
        "نستخدم ملفات الارتباط والتخزين المحلي في متصفحك لإبقائك مسجل الدخول، ولحفظ سلتك وقائمة أمنياتك ولغتك وتفضيلك للوضع الفاتح أو الداكن، ولفهم طريقة استخدام الموقع بهدف تحسينه.",
        "يمكنك حذفها أو حظرها من إعدادات المتصفح. وحظرها سيؤدي إلى تسجيل خروجك وقد يوقف عمل أجزاء من الموقع.",
      ],
    },
    {
      heading: "مدة الاحتفاظ ببياناتك",
      body: [
        "نحتفظ ببيانات حسابك ما دام حسابك مفتوحاً. أما سجلات الطلبات والفواتير والمدفوعات فنحتفظ بها للمدة التي تتطلبها الأنظمة الضريبية والتجارية السعودية، حتى وإن أغلقت حسابك.",
        "وعندما تنتفي الحاجة إلى البيانات لأي من الغرضين، نحذفها أو نجعلها مجهولة الهوية بشكل دائم.",
      ],
    },
    {
      heading: "الأمان",
      body: [
        "تُخزَّن بياناتك على خوادم داخل المملكة العربية السعودية. والاتصال بين متصفحك وأنظمتنا مشفّر أثناء النقل، والوصول إلى أنظمة التشغيل مقتصر على من يحتاجه من الموظفين، وبيانات بطاقات الدفع لا تصل إلى خوادمنا إطلاقاً.",
        "لا يوجد نظام آمن تماماً. وإذا وقع اختراق يؤثر على بياناتك الشخصية، فسنخطرك وتخطر الجهة المختصة وفق ما يقتضيه النظام.",
      ],
    },
    {
      heading: "حقوقك",
      body: ["بموجب نظام حماية البيانات الشخصية السعودي، لك الحق في:"],
      bullets: [
        "العلم بكيفية جمع بياناتك واستخدامها، وهو الغرض من هذه السياسة.",
        "طلب نسخة من بياناتك الشخصية التي نحتفظ بها.",
        "طلب تصحيح البيانات غير الصحيحة أو غير المكتملة. ويمكنك تعديل معظمها بنفسك من ملفك الشخصي.",
        "طلب حذف بياناتك، مع مراعاة السجلات التي يلزمنا النظام بالاحتفاظ بها.",
        "سحب موافقتك على المعالجة القائمة على الموافقة، بما في ذلك الرسائل التسويقية وإشعارات الجهاز.",
      ],
    },
    {
      heading: "كيفية ممارسة حقوقك",
      body: [
        `لتقديم أي من هذه الطلبات، راسلنا على ${COMPANY.email} أو اتصل على ${COMPANY.phone}. وسنرد خلال ثلاثين يوماً. وقد نطلب منك إثبات هويتك أولاً، حتى لا يتمكن أي شخص آخر من الحصول على بياناتك أو حذفها.`,
        "وإذا لم تكن راضياً عن ردنا، يمكنك تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي.",
      ],
    },
    {
      heading: "الأطفال",
      body: [
        "قافلة ليست موجهة لمن هم دون الثامنة عشرة، ولا نجمع بياناتهم الشخصية عن علم. وإذا كنت تعتقد أن طفلاً زوّدنا ببياناته، فتواصل معنا وسنحذفها.",
      ],
    },
    {
      heading: "النقل خارج المملكة",
      body: [
        "بعض مزودي الخدمة الذين نعتمد عليهم، مثل مزودي تسجيل الدخول والإشعارات، يعملون خارج المملكة العربية السعودية. وعند نقل بياناتك إلى خارج المملكة، فإننا نفعل ذلك فقط بما يسمح به نظام حماية البيانات الشخصية ومع مزودين يوفرون مستوى حماية كافياً.",
      ],
    },
    {
      heading: "التعديلات على هذه السياسة",
      body: [
        "قد نحدّث هذه السياسة مع تطور الخدمة أو بحسب ما يقتضيه النظام. ويوضح التاريخ في الأعلى موعد آخر تعديل. وإذا كان التعديل يؤثر جوهرياً على حقوقك، فسنخبرك عبر الموقع أو برسالة قبل نفاذه.",
      ],
    },
    {
      heading: "تواصل معنا",
      body: [
        `لأي استفسار بخصوص هذه السياسة أو بياناتك، راسلنا على ${COMPANY.email} أو اتصل على ${COMPANY.phone}. وعنواننا هو ${COMPANY.addressAr}.`,
      ],
    },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms and Conditions",
  updatedLabel: `Last updated: ${UPDATED_EN}`,
  intro: [
    `These terms govern your use of ${COMPANY.site} and any order you place through it. By creating an account or placing an order, you agree to them. If you do not agree, please do not use the site.`,
  ],
  sections: [
    {
      heading: "About Qafila",
      body: [
        `Qafila is a multi-vendor marketplace based in ${COMPANY.addressEn}, VAT registration number ${COMPANY.vat}.`,
        "Qafila operates the platform. With the exception of products we state are sold by Qafila itself, the seller of each product is the independent vendor listed on the product page. That vendor is responsible for the accuracy of its listing, the quality and legality of its products, and fulfilling the orders placed with it. Qafila facilitates the transaction, takes payment and provides support.",
      ],
    },
    {
      heading: "Eligibility and your account",
      bullets: [
        "You must be at least eighteen years old and legally able to enter into a contract.",
        "You may sign in with a one-time password sent to your mobile number, or with your Google account. Both routes lead to the same Qafila account when they share a verified email address.",
        "You are responsible for keeping access to your phone number and email secure, and for activity that takes place through your account.",
        "The information you give us must be accurate and kept up to date, particularly delivery addresses and contact numbers.",
        "One person should hold one account. We may suspend or close accounts used for fraud, abuse or breach of these terms.",
      ],
    },
    {
      heading: "Products, prices and availability",
      bullets: [
        "Product descriptions, images and specifications are provided by the vendor. Colours may differ slightly between screens.",
        "All prices are shown in Saudi riyals and are inclusive of value added tax at the applicable rate.",
        "Delivery fees, where they apply, are shown at checkout before you pay.",
        "Listing a product is not a guarantee that it is in stock. If an item becomes unavailable after you order, we will tell you and refund that item.",
        "We try to keep prices and details accurate. Where an obvious pricing error occurs, we may cancel the affected order and refund you in full rather than fulfil it at the wrong price.",
      ],
    },
    {
      heading: "Orders",
      body: [
        "Placing an order is an offer to buy. A contract is formed when we confirm the order and the vendor accepts it for fulfilment. Where an order contains items from more than one vendor, it is split and each part is fulfilled and tracked separately, so parts may arrive at different times.",
        "We may decline or cancel an order where the item is unavailable, where payment fails or is flagged, where the delivery address is outside our service area, or where we reasonably suspect fraud or misuse.",
      ],
    },
    {
      heading: "Payment",
      bullets: [
        "Payment is taken at checkout through a licensed payment provider. Card details are entered directly with that provider and are never held by Qafila.",
        "Where buy-now-pay-later instalments are offered, that arrangement is a separate agreement between you and the instalment provider. Their eligibility rules, fees and terms apply, and approval is at their discretion, not ours.",
        "A tax invoice is issued for every order and is available in your account.",
        "If a payment is reversed or charged back after an order has shipped, we may suspend your account until the matter is resolved.",
      ],
    },
    {
      heading: "Delivery",
      bullets: [
        "Delivery timeframes shown at checkout are estimates, not guarantees. They depend on the vendor, the carrier and your location.",
        "You are responsible for giving a complete and correct delivery address and a phone number that can be reached. Failed deliveries caused by wrong or unreachable contact details may incur a redelivery fee.",
        "Risk in the goods passes to you on delivery to the address you provided.",
      ],
    },
    {
      heading: "Returns, cancellation and refunds",
      bullets: [
        "You may cancel an order at no cost while it has not yet been shipped.",
        "Where a product arrives damaged, faulty, or materially different from its description, contact us and we will arrange a return and a full refund including delivery.",
        "Some products cannot be returned once opened for reasons of hygiene, safety or because they are made to order. Where this applies it is stated on the product page.",
        "Approved refunds are returned to the original payment method. The time it takes to appear depends on your bank or instalment provider.",
      ],
    },
    {
      heading: "Reviews and content you post",
      body: [
        "You may post reviews, ratings, photographs and comments. What you post must be your own, accurate, and free of unlawful, offensive, misleading or infringing material.",
        "By posting, you grant Qafila a non-exclusive, royalty-free licence to display, reproduce and distribute that content on the platform and in related marketing. We may remove content that breaches these terms.",
      ],
    },
    {
      heading: "Subscriptions",
      body: [
        "Some features are offered through paid subscription plans. The price, billing period and included features are shown before you subscribe. Subscriptions renew automatically for the same period unless cancelled before the renewal date, and cancelling stops future renewals rather than refunding the current period.",
      ],
    },
    {
      heading: "Acceptable use",
      body: ["You agree not to:"],
      bullets: [
        "Use the platform for any unlawful purpose, or to buy or resell prohibited goods.",
        "Interfere with the site, attempt to gain unauthorised access, or probe its security.",
        "Scrape, copy or systematically extract content, listings or prices.",
        "Impersonate another person, or place orders using payment details that are not yours.",
        "Post fake reviews, or manipulate ratings or search results.",
      ],
    },
    {
      heading: "Intellectual property",
      body: [
        "The Qafila name, logo, site design, software and content are owned by Qafila or its licensors and are protected by law. Product images and brand names belong to their respective owners. Nothing in these terms transfers any of those rights to you.",
      ],
    },
    {
      heading: "Availability and liability",
      body: [
        "We work to keep the platform available, but we do not guarantee uninterrupted or error-free service, and we may suspend it for maintenance or for reasons beyond our control.",
        "Nothing in these terms excludes liability that cannot be excluded under Saudi law, including liability for death or personal injury caused by negligence, or for fraud. Subject to that, Qafila is not liable for indirect or consequential loss, and our total liability in connection with any order is limited to the amount you paid for that order.",
      ],
    },
    {
      heading: "Governing law and disputes",
      body: [
        "These terms are governed by the laws of the Kingdom of Saudi Arabia. Any dispute that cannot be resolved between us will be subject to the jurisdiction of the competent Saudi courts.",
        `Before that, please contact us at ${COMPANY.email}. Most issues are resolved quickly and directly.`,
      ],
    },
    {
      heading: "Changes to these terms",
      body: [
        "We may update these terms as the platform or the law changes. The date at the top shows when they last changed. Orders are governed by the terms in force when the order was placed.",
      ],
    },
    {
      heading: "Contact us",
      body: [
        `Email ${COMPANY.email} or call ${COMPANY.phone}. Our address is ${COMPANY.addressEn}.`,
      ],
    },
  ],
};

const termsAr: LegalDoc = {
  title: "الشروط والأحكام",
  updatedLabel: `آخر تحديث: ${UPDATED_AR}`,
  intro: [
    `تحكم هذه الشروط استخدامك لموقع ${COMPANY.site} وأي طلب تقدمه من خلاله. وبإنشائك حساباً أو تقديمك طلباً فإنك توافق عليها. وإذا لم توافق عليها، فيرجى عدم استخدام الموقع.`,
  ],
  sections: [
    {
      heading: "عن قافلة",
      body: [
        `قافلة سوق إلكتروني متعدد البائعين مقره ${COMPANY.addressAr}، ورقمه الضريبي ${COMPANY.vat}.`,
        "تُشغّل قافلة المنصة. وباستثناء المنتجات التي نوضح أنها مباعة من قافلة نفسها، فإن بائع كل منتج هو البائع المستقل الظاهر في صفحة المنتج، وهو المسؤول عن دقة إعلانه وعن جودة منتجاته ونظاميتها وعن تنفيذ الطلبات المقدمة إليه. وتتولى قافلة تسهيل المعاملة وتحصيل المدفوعات وتقديم الدعم.",
      ],
    },
    {
      heading: "الأهلية وحسابك",
      bullets: [
        "يجب ألا يقل عمرك عن ثمانية عشر عاماً وأن تكون مؤهلاً نظاماً للتعاقد.",
        "يمكنك تسجيل الدخول عبر رمز تحقق يُرسل إلى رقم جوالك أو عبر حسابك في جوجل. ويؤدي المساران إلى الحساب نفسه في قافلة عند تطابق البريد الإلكتروني الموثّق.",
        "أنت مسؤول عن الحفاظ على أمان الوصول إلى رقم جوالك وبريدك الإلكتروني، وعن النشاط الذي يتم عبر حسابك.",
        "يجب أن تكون البيانات التي تزودنا بها صحيحة ومحدّثة، ولا سيما عناوين التوصيل وأرقام التواصل.",
        "يُفترض أن يكون لكل شخص حساب واحد. ويحق لنا تعليق أو إغلاق الحسابات المستخدمة في الاحتيال أو إساءة الاستخدام أو مخالفة هذه الشروط.",
      ],
    },
    {
      heading: "المنتجات والأسعار والتوافر",
      bullets: [
        "أوصاف المنتجات وصورها ومواصفاتها مقدمة من البائع. وقد تختلف الألوان اختلافاً يسيراً بين الشاشات.",
        "جميع الأسعار معروضة بالريال السعودي وشاملة ضريبة القيمة المضافة بالنسبة النظامية المطبقة.",
        "تظهر رسوم التوصيل، إن وُجدت، في صفحة الدفع قبل إتمام الشراء.",
        "عرض المنتج لا يعني ضمان توفره في المخزون. وإذا نفد الصنف بعد تقديمك الطلب، فسنخبرك ونعيد لك قيمته.",
        "نحرص على دقة الأسعار والتفاصيل. وفي حال وقوع خطأ سعري ظاهر، يحق لنا إلغاء الطلب المتأثر وإعادة المبلغ كاملاً بدلاً من تنفيذه بسعر خاطئ.",
      ],
    },
    {
      heading: "الطلبات",
      body: [
        "تقديم الطلب يُعد عرضاً للشراء. وينعقد العقد عند تأكيدنا للطلب وقبول البائع تنفيذه. وإذا احتوى الطلب على أصناف من أكثر من بائع، فإنه يُقسّم ويُنفّذ ويُتابع كل جزء على حدة، وقد تصل الأجزاء في أوقات مختلفة.",
        "يحق لنا رفض الطلب أو إلغاؤه إذا كان الصنف غير متوفر، أو تعذّر الدفع أو اشتبه فيه، أو كان عنوان التوصيل خارج نطاق خدمتنا، أو عند وجود اشتباه معقول في احتيال أو إساءة استخدام.",
      ],
    },
    {
      heading: "الدفع",
      bullets: [
        "يتم تحصيل المبلغ عند إتمام الطلب عبر مزود دفع مرخص. وتُدخل بيانات البطاقة مباشرة لدى ذلك المزود ولا تحتفظ بها قافلة إطلاقاً.",
        "عند إتاحة الدفع بالتقسيط، فإن ذلك الترتيب اتفاق منفصل بينك وبين مزود التقسيط. وتسري شروطه ورسومه ومعايير أهليته، والموافقة تعود لتقديره لا لتقديرنا.",
        "تُصدر فاتورة ضريبية لكل طلب وتكون متاحة في حسابك.",
        "إذا عُكست عملية دفع أو استُردّت بعد شحن الطلب، فيحق لنا تعليق حسابك حتى تسوية الأمر.",
      ],
    },
    {
      heading: "التوصيل",
      bullets: [
        "مدد التوصيل المعروضة عند الدفع تقديرية وليست مضمونة، وتعتمد على البائع وشركة الشحن وموقعك.",
        "أنت مسؤول عن تقديم عنوان توصيل كامل وصحيح ورقم جوال يمكن الوصول إليه. وقد تترتب رسوم إعادة توصيل على المحاولات الفاشلة الناتجة عن بيانات خاطئة أو يتعذر الوصول إليها.",
        "تنتقل تبعة الهلاك في البضاعة إليك عند تسليمها على العنوان الذي زودتنا به.",
      ],
    },
    {
      heading: "الإرجاع والإلغاء واسترداد المبالغ",
      bullets: [
        "يمكنك إلغاء الطلب دون أي تكلفة ما دام لم يُشحن بعد.",
        "إذا وصل المنتج تالفاً أو معيباً أو مختلفاً جوهرياً عن وصفه، فتواصل معنا وسنرتب إرجاعه واسترداد قيمته كاملة شاملة التوصيل.",
        "بعض المنتجات لا يمكن إرجاعها بعد فتحها لأسباب صحية أو سلامة أو لكونها مصنّعة حسب الطلب، ويُوضّح ذلك في صفحة المنتج.",
        "تُعاد المبالغ المعتمدة إلى وسيلة الدفع الأصلية. وتعتمد مدة ظهورها على بنكك أو مزود التقسيط.",
      ],
    },
    {
      heading: "التقييمات والمحتوى الذي تنشره",
      body: [
        "يمكنك نشر تقييمات ومراجعات وصور وتعليقات. ويجب أن يكون ما تنشره من إنشائك وصحيحاً وخالياً من أي مادة مخالفة للنظام أو مسيئة أو مضللة أو منتهكة لحقوق الغير.",
        "وبنشرك للمحتوى، فإنك تمنح قافلة ترخيصاً غير حصري ومجاني لعرضه ونسخه وتوزيعه على المنصة وفي التسويق المرتبط بها. ويحق لنا إزالة المحتوى المخالف لهذه الشروط.",
      ],
    },
    {
      heading: "الاشتراكات",
      body: [
        "تُقدَّم بعض المزايا عبر باقات اشتراك مدفوعة. ويظهر السعر ومدة الفوترة والمزايا المشمولة قبل الاشتراك. وتتجدد الاشتراكات تلقائياً للمدة نفسها ما لم تُلغَ قبل تاريخ التجديد، والإلغاء يوقف التجديدات المستقبلية ولا يعيد قيمة المدة الجارية.",
      ],
    },
    {
      heading: "الاستخدام المقبول",
      body: ["أنت توافق على عدم:"],
      bullets: [
        "استخدام المنصة لأي غرض مخالف للنظام، أو لشراء أو إعادة بيع سلع محظورة.",
        "التشويش على الموقع أو محاولة الوصول غير المصرح به إليه أو اختبار أمنه.",
        "سحب أو نسخ أو استخراج المحتوى أو الإعلانات أو الأسعار بشكل منهجي.",
        "انتحال شخصية غيرك أو تقديم طلبات باستخدام بيانات دفع لا تعود لك.",
        "نشر تقييمات وهمية أو التلاعب بالتقييمات أو نتائج البحث.",
      ],
    },
    {
      heading: "الملكية الفكرية",
      body: [
        "اسم قافلة وشعارها وتصميم الموقع وبرمجياته ومحتواه مملوكة لقافلة أو للمرخصين لها ومحمية نظاماً. وصور المنتجات والعلامات التجارية تعود لأصحابها. ولا ينقل أي مما ورد في هذه الشروط أياً من تلك الحقوق إليك.",
      ],
    },
    {
      heading: "التوافر والمسؤولية",
      body: [
        "نعمل على إبقاء المنصة متاحة، إلا أننا لا نضمن استمرار الخدمة دون انقطاع أو خلوها من الأخطاء، وقد نوقفها للصيانة أو لأسباب خارجة عن إرادتنا.",
        "لا يستثني أي مما ورد في هذه الشروط المسؤولية التي لا يجوز استثناؤها بموجب الأنظمة السعودية. ومع مراعاة ذلك، لا تتحمل قافلة المسؤولية عن الأضرار غير المباشرة أو التبعية، وتقتصر مسؤوليتنا الإجمالية المرتبطة بأي طلب على المبلغ الذي دفعته مقابل ذلك الطلب.",
      ],
    },
    {
      heading: "النظام الواجب التطبيق وتسوية المنازعات",
      body: [
        "تخضع هذه الشروط لأنظمة المملكة العربية السعودية. وأي نزاع يتعذر تسويته بيننا يخضع لاختصاص المحاكم السعودية المختصة.",
        `وقبل ذلك، يرجى التواصل معنا على ${COMPANY.email}. فمعظم المسائل تُحل بسرعة وبشكل مباشر.`,
      ],
    },
    {
      heading: "التعديلات على هذه الشروط",
      body: [
        "قد نحدّث هذه الشروط مع تطور المنصة أو تغير الأنظمة. ويوضح التاريخ في الأعلى موعد آخر تعديل. وتخضع الطلبات للشروط السارية وقت تقديم الطلب.",
      ],
    },
    {
      heading: "تواصل معنا",
      body: [
        `راسلنا على ${COMPANY.email} أو اتصل على ${COMPANY.phone}. وعنواننا هو ${COMPANY.addressAr}.`,
      ],
    },
  ],
};

export function getPrivacy(locale: string): LegalDoc {
  return locale === "ar" ? privacyAr : privacyEn;
}

export function getTerms(locale: string): LegalDoc {
  return locale === "ar" ? termsAr : termsEn;
}
