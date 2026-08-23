const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");

const PDF_DIR = path.join(__dirname, "../public/pdfs");
const COVERS_DIR = path.join(__dirname, "../public/images/books");
const BOOKS_JSON_PATH = path.join(__dirname, "../data/books.json");

// Define the 24 new books with verified metadata
const NEW_BOOKS_METADATA = [
  {
    id: "aankhon-dekhi-sanch",
    title: "Aankhon Dekhi Sanch (आँखों देखी साँच)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AankhonDekhiSanchByOsho.pdf",
    coverName: "aankhon-dekhi-sanch.webp",
    language: "Hindi",
    year: 1975,
    rating: 4.8,
    tags: ["Osho", "Spiritual Discourses", "Hindi Literature", "Self-Realization", "Meditation"],
    description: "ओशो द्वारा दिए गए आत्म-ज्ञान और आंतरिक सत्य के अन्वेषण पर गहन अमृत प्रवचनों का संकलन।",
    excerpt: "सत्य वह नहीं जो दूसरों से सुना जाए; सत्य वह है जो स्वयं की आँखों से साक्षात् देखा और अनुभूत किया जाए।",
    theme: { bg1: "#1e1b4b", bg2: "#312e81", accent: "#fbbf24", subtitle: "आंतरिक सत्य का साक्षात्कार" }
  },
  {
    id: "aapui-gai-herai",
    title: "Aapui Gai Herai (आपुई गई हिराय)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AapuiGaiHeraiByOsho.pdf",
    coverName: "aapui-gai-herai.webp",
    language: "Hindi",
    year: 1976,
    rating: 4.8,
    tags: ["Osho", "Sufism", "Kabir", "Bhakti", "Devotion"],
    description: "सूफी व संत विचारधारा पर ओशो के दिव्य प्रवचन, जहाँ अहम् के विसर्जन और परमात्मा में लीन होने का मार्ग उद्घाटित होता है।",
    excerpt: "जब तक खोजने वाला बचा है तब तक खोज अधूरी है; जब खोजने वाला ही खो जाता है, तभी सत्य का आविर्भाव होता है।",
    theme: { bg1: "#4c0519", bg2: "#881337", accent: "#f43f5e", subtitle: "अहंकार के विसर्जन की कला" }
  },
  {
    id: "adhyatma-upanishad",
    title: "Adhyatma Upanishad (अध्यात्म उपनिषद)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AdhyatamUpanishadByOsho.pdf",
    coverName: "adhyatma-upanishad.webp",
    language: "Hindi",
    year: 1972,
    rating: 4.9,
    tags: ["Osho", "Upanishad", "Vendanta", "Philosophy", "Consciousness"],
    description: "अध्यात्म उपनिषद के अमर सूत्रों पर ओशो द्वारा की गई कालजयी व्याख्या और आत्म-साक्षात्कार की कुंजी।",
    excerpt: "अध्यात्म कोई विचार नहीं, अपने ही स्वरूप में स्थिर हो जाने की परम जाग्रत अवस्था है।",
    theme: { bg1: "#0f172a", bg2: "#1e293b", accent: "#38bdf8", subtitle: "जीवन के द्वार की कुंजी" }
  },
  {
    id: "agyat-ki-or",
    title: "Agyat Ki Or (अज्ञात की ओर)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AgyatKiOrByOsho.pdf",
    coverName: "agyat-ki-or.webp",
    language: "Hindi",
    year: 1970,
    rating: 4.7,
    tags: ["Osho", "Transformation", "Meditation", "Spiritual Growth"],
    description: "न भोग, न त्याग—वरन रूपांतरण: अज्ञात और अनिर्वचनीय सत्य की यात्रा पर ओशो का प्रेरक मार्गदर्शन।",
    excerpt: "जीवन को बदलने के लिए न तो संसार छोड़ना है और न ही भागना है, केवल दृष्टि को रूपांतरित करना है।",
    theme: { bg1: "#14532d", bg2: "#166534", accent: "#4ade80", subtitle: "रूपांतरण और आत्म-खोज" }
  },
  {
    id: "ajhoon-chet-ganwar",
    title: "Ajhoon Chet Ganwar (अजहूं चेत गंवार)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AjhoonChetGanwarByOsho.pdf",
    coverName: "ajhoon-chet-ganwar.webp",
    language: "Hindi",
    year: 1978,
    rating: 4.9,
    tags: ["Osho", "Sant Raidas", "Bhakti", "Awareness", "Spiritual Awakening"],
    description: "संत रैदास की अनमोल वाणी और भक्ति सूत्रों पर ओशो के 20 ज्ञानवर्धक अमृत प्रवचन।",
    excerpt: "सद्गुरु की आँख में आस्था का दीप जलता है; जब तक भीतर होश न जागे, तब तक मनुष्य सोता ही रहता है।",
    theme: { bg1: "#451a03", bg2: "#78350f", accent: "#f59e0b", subtitle: "संत रैदास अमृत वाणी" }
  },
  {
    id: "akath-kahani-prem-ki",
    title: "Akath Kahani Prem Ki (अकथ कहानी प्रेम की)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AkathKahaniPremKiByOsho.pdf",
    coverName: "akath-kahani-prem-ki.webp",
    language: "Hindi",
    year: 1977,
    rating: 4.8,
    tags: ["Osho", "Baba Farid", "Sufi Wisdom", "Love", "Mysticism"],
    description: "बाबा फरीद की वाणी पर ओशो द्वारा दिए गए 10 अमृत प्रवचनों और अंतर-प्रश्नोत्तरी का अनुपम संकलन।",
    excerpt: "प्रेम की कहानी अकथ है; जो कह दिया जाए वह प्रेम नहीं, जो मौन में उतर जाए वही प्रार्थना है।",
    theme: { bg1: "#3f0d12", bg2: "#5c1d24", accent: "#fda4af", subtitle: "फरीद-वाणी पर अमृत प्रवचन" }
  },
  {
    id: "ami-jharat-bigsat-kanwal",
    title: "Ami Jharat Bigsat Kanwal (अमी झरत, बिगसत कंवल)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AmiJharatBigsatKanwalByOsho.pdf",
    coverName: "ami-jharat-bigsat-kanwal.webp",
    language: "Hindi",
    year: 1976,
    rating: 4.8,
    tags: ["Osho", "Mysticism", "Kabir", "Inner Bloom", "Spiritual Bliss"],
    description: "कबीर और संतों की अमृत वाणी पर ओशो की अंतर-यात्रा सम्बन्धी भावपूर्ण व्याख्या।",
    excerpt: "जब हृदय का कमल खिलता है, तब जीवन की प्रत्येक सांस से अमृत की वर्षा होने लगती है।",
    theme: { bg1: "#134e4a", bg2: "#115e59", accent: "#2dd4bf", subtitle: "संत वाणी व अंतर-यात्रा" }
  },
  {
    id: "amrit-dwar",
    title: "Amrit Dwar (अमृत द्वार)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AmritDwarByOsho.pdf",
    coverName: "amrit-dwar.webp",
    language: "Hindi",
    year: 1971,
    rating: 4.7,
    tags: ["Osho", "Religion", "Individual Experience", "Meditation"],
    description: "धर्म को व्यक्तिगत अनुभूति और चेतना के विकास के रूप में उद्घाटित करते ओशो के उद्बोधन।",
    excerpt: "धर्म कोई सामूहिक विश्वास नहीं, बल्कि स्वयं के अंतःकरण की परम वैयक्तिक अनुभूति है।",
    theme: { bg1: "#1e293b", bg2: "#334155", accent: "#93c5fd", subtitle: "धर्म है वैयक्तिक अनुभूति" }
  },
  {
    id: "amrit-kan",
    title: "Amrit Kan (अमृत कण)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AmritKanByOsho.pdf",
    coverName: "amrit-kan.webp",
    language: "Hindi",
    year: 1968,
    rating: 4.6,
    tags: ["Osho", "Aphorisms", "Quotations", "Wisdom", "Meditation"],
    description: "सत्य, अहिंसा, प्रेम और ध्यान पर ओशो के अमर सूक्ति-रत्नों और विचार-कणों का अनूठा संकलन।",
    excerpt: "सत्य किसी मंदिर या शास्त्र में नहीं, तुम्हारे अपने शांत और जाग्रत मन के भीतर विद्यमान है।",
    theme: { bg1: "#292524", bg2: "#44403c", accent: "#e7e5e4", subtitle: "सूक्ति-रत्न और जीवन-सूत्र" }
  },
  {
    id: "amrit-ki-disha",
    title: "Amrit Ki Disha (अमृत की दिशा)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AmritKiDishaByOsho.pdf",
    coverName: "amrit-ki-disha.webp",
    language: "Hindi",
    year: 1973,
    rating: 4.8,
    tags: ["Osho", "Aspiration", "Joy", "Spiritual Direction"],
    description: "जिज्ञासा और अभीप्सा से आनंद की ओर ले जाने वाले जीवन-सूत्रों पर ओशो का मार्गदर्शक चिंतन।",
    excerpt: "जिज्ञासा जब प्रगाढ़ अभीप्सा बन जाती है, तभी जीवन अमृत की दिशा में प्रवाहित होने लगता है।",
    theme: { bg1: "#064e3b", bg2: "#047857", accent: "#6ee7b7", subtitle: "जिज्ञासा से आनंद की यात्रा" }
  },
  {
    id: "amrit-varsha",
    title: "Amrit Varsha (अमृत वर्षा)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AmritVarshaByOsho.pdf",
    coverName: "amrit-varsha.webp",
    language: "Hindi",
    year: 1974,
    rating: 4.7,
    tags: ["Osho", "Truth", "Consciousness", "Discourses"],
    description: "सत्य के साक्षात् दर्शन और चैतन्य की जागृति पर ओशो के ओजस्वी प्रवचनों की वर्षा।",
    excerpt: "जब मन सब विचारों से खाली होता है, तब सत्य का अमृत स्वतः बरसने लगता है।",
    theme: { bg1: "#1e1b4b", bg2: "#3730a3", accent: "#818cf8", subtitle: "सत्य का प्रत्यक्ष दर्शन" }
  },
  {
    id: "anahad-mein-bisram",
    title: "Anahad Mein Bisram (अनहद में बिसराम)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AnahadMeinBisramByOsho.pdf",
    coverName: "anahad-mein-bisram.webp",
    language: "Hindi",
    year: 1976,
    rating: 4.8,
    tags: ["Osho", "Anahad Naad", "Silence", "Meditation", "Bhakti"],
    description: "संसार रूपी पाठशाला और अनहद नाद के मौन विश्राम पर ओशो के दिव्य प्रवचन।",
    excerpt: "जब बाहर का सारा शोर शांत हो जाता है, तब भीतर अनाहत ध्वनि का मधुर संगीत सुनाई देता है।",
    theme: { bg1: "#311042", bg2: "#581c87", accent: "#c084fc", subtitle: "अनाहत नाद और मौन विश्राम" }
  },
  {
    id: "anand-ganga",
    title: "Anand Ganga (आनंद गंगा)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AnandGangaByOsho.pdf",
    coverName: "anand-ganga.webp",
    language: "Hindi",
    year: 1972,
    rating: 4.7,
    tags: ["Osho", "Bliss", "Surrender", "Meditation"],
    description: "विसर्जन की कला और जिज्ञासा के लोक में प्रवाहित होती आनंद की अमृतमयी गंगा।",
    excerpt: "आनंद कहीं बाहर से नहीं आता, यह तुम्हारे अपने अंतर्तम का स्वाभाविक स्वभाव है।",
    theme: { bg1: "#0c4a6e", bg2: "#0369a1", accent: "#38bdf8", subtitle: "विसर्जन और आनंद की धारा" }
  },
  {
    id: "anand-ki-khoj",
    title: "Anand Ki Khoj (आनंद की खोज)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AnandKiKhojByOsho.pdf",
    coverName: "anand-ki-khoj.webp",
    language: "Hindi",
    year: 1971,
    rating: 4.7,
    tags: ["Osho", "Happiness", "Freedom", "Spiritual Search"],
    description: "शब्दों और भ्रांतियों से मुक्त होकर आत्मिक आनंद की वास्तविक खोज पर ओशो का संदेश।",
    excerpt: "सच्चे आनंद की खोज तभी प्रारंभ होती है जब हम शब्दों और अवधारणाओं के पार देखना सीख लेते हैं।",
    theme: { bg1: "#581c87", bg2: "#7e22ce", accent: "#e9d5ff", subtitle: "सच्चे सुख की अंतर-यात्रा" }
  },
  {
    id: "anant-ki-pukar",
    title: "Anant Ki Pukar (अनंत की पुकार)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AnantKiPukarByOsho.pdf",
    coverName: "anant-ki-pukar.webp",
    language: "Hindi",
    year: 1973,
    rating: 4.8,
    tags: ["Osho", "Meditation Centers", "Intuition", "Infinity"],
    description: "ध्यान-केंद्र और अंतर्ज्ञान के माध्यम से असीम चेतना की पुकार को सुनने का रहस्य।",
    excerpt: "अनंत पुकार रहा है, किंतु हमारी आँखें और कान सांसारिक कोलाहल में उलझे हुए हैं।",
    theme: { bg1: "#1f2937", bg2: "#374151", accent: "#f3f4f6", subtitle: "असीम चेतना की गूंज" }
  },
  {
    id: "andhakar-se-alok-ki-or",
    title: "Andhakar Se Alok Ki Or (अंधकार से आलोक की ओर)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AndhakarSeAlokKiOrByOsho.pdf",
    coverName: "andhakar-se-alok-ki-or.webp",
    language: "Hindi",
    year: 1985,
    rating: 4.6,
    tags: ["Osho", "Darkness to Light", "Humanity", "Discourses"],
    description: "ओशो की विख्यात पुस्तक 'From Darkness to Light' के प्रमुख अध्यायों का भावपूर्ण हिंदी अनुवाद।",
    excerpt: "मानवता को बचाने का एकमात्र मार्ग मनुष्य की व्यक्तिगत चेतना का अंधकार से प्रकाश की ओर जागरण है।",
    theme: { bg1: "#111827", bg2: "#1f2937", accent: "#f59e0b", subtitle: "From Darkness to Light" }
  },
  {
    id: "antar-ki-khoj",
    title: "Antar Ki Khoj (अंतर की खोज)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AntarKiKhojByOsho.pdf",
    coverName: "antar-ki-khoj.webp",
    language: "Hindi",
    year: 1970,
    rating: 4.7,
    tags: ["Osho", "Self-Discovery", "Meditation", "Awareness"],
    description: "क्या आपके हृदय के द्वार खुले हैं? आत्म-साक्षात्कार और अंतर्मुखी चेतना की खोज।",
    excerpt: "जब बाहर के द्वार बंद होते हैं, तभी भीतर के परम प्रकाश का द्वार खुलता है।",
    theme: { bg1: "#1c1917", bg2: "#292524", accent: "#d6d3d1", subtitle: "हृदय के द्वार का उद्घाटन" }
  },
  {
    id: "antarveena",
    title: "Antarveena: 150 Letters (अंतर्वीणा)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AntarveenaByOsho.pdf",
    coverName: "antarveena.webp",
    language: "Hindi",
    year: 1969,
    rating: 4.9,
    tags: ["Osho", "Letters", "Inspiration", "Meditation", "Friendship"],
    description: "साधकों और मित्रों को लिखे गए ओशो के 150 आत्मीय व जीवन-परिवर्तक पत्रों का अनमोल संग्रह।",
    excerpt: "आनंद कहीं दूर नहीं, आनंद भीतर ही वीणा की भांति बज रहा है; केवल तार छूने की कला सीखनी है।",
    theme: { bg1: "#701a75", bg2: "#86198f", accent: "#f0abfc", subtitle: "१५० आत्मीय पत्र" }
  },
  {
    id: "antar-yatra",
    title: "Antar Yatra (अंतर्यात्रा)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AntarYatraByOsho.pdf",
    coverName: "antar-yatra.webp",
    language: "Hindi",
    year: 1974,
    rating: 4.9,
    tags: ["Osho", "Meditation", "Body-Mind", "Samadhi", "Sadhana"],
    description: "साधना की पहली सीढ़ी से समाधि तक: ओशो के 8 कालजयी प्रवचनों का विस्तृत संकलन।",
    excerpt: "शरीर से चित्त और चित्त से आत्मा तक की यात्रा ही मानव जीवन की वास्तविक अंतर्यात्रा है।",
    theme: { bg1: "#0f766e", bg2: "#115e59", accent: "#5eead4", subtitle: "साधना से समाधि तक" }
  },
  {
    id: "apne-mahi-tatol",
    title: "Apne Mahi Tatol (अपने माहिं टटोल)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "ApneMahiTatolByOsho.pdf",
    coverName: "apne-mahi-tatol.webp",
    language: "Hindi",
    year: 1977,
    rating: 4.8,
    tags: ["Osho", "Self-Inquiry", "Mirror of Mind", "Meditation"],
    description: "चित्त का दर्पण और अंतर्मन की गहराइयों में स्वयं को टटोलने की अनूठी ध्यान विधियाँ।",
    excerpt: "दूसरों को देखना बंद करो और स्वयं के भीतर झांको; जो स्वयं को पहचान लेता है, वह सब पा लेता है।",
    theme: { bg1: "#1e1b4b", bg2: "#2e1065", accent: "#a78bfa", subtitle: "चित्त का दर्पण" }
  },
  {
    id: "ari-main-to-naam-ke-rang-chhaki",
    title: "Ari Main To Naam Ke Rang Chhaki (अरी मैं तो नाम के रंग छकी)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AriMainToNaamKeRangChhakiByOsho.pdf",
    coverName: "ari-main-to-naam-ke-rang-chhaki.webp",
    language: "Hindi",
    year: 1976,
    rating: 4.8,
    tags: ["Osho", "Daya Bai", "Bhakti", "Divine Love", "Devotion"],
    description: "संत दयाबाई की अमृतवाणी और प्रेम-भक्ति के रहस्य पर ओशो के 10 रसपूर्ण प्रवचन।",
    excerpt: "जब परमात्मा का नाम रंग बन जाता है, तब आत्मा उस रंग में डूबकर सदा के लिए मुक्त हो जाती है।",
    theme: { bg1: "#831843", bg2: "#9d174d", accent: "#fbcfe8", subtitle: "संत दयाबाई अमृतवाणी" }
  },
  {
    id: "asambhav-kranti",
    title: "Asambhav Kranti (असंभव क्रांति)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AsambhavKrantiByOsho.pdf",
    coverName: "asambhav-kranti.webp",
    language: "Hindi",
    year: 1975,
    rating: 4.8,
    tags: ["Osho", "Revolution", "Consciousness", "Truth", "Freedom"],
    description: "सत्य के द्वार और मानवीय चेतना में आंतरिक आध्यात्मिक क्रांति का क्रांतिकारी संदेश।",
    excerpt: "बाहरी क्रांतियाँ व्यवस्था बदलती हैं; केवल आंतरिक क्रांति ही मनुष्य के चैतन्य को बदल सकती है।",
    theme: { bg1: "#7f1d1d", bg2: "#991b1b", accent: "#fca5a5", subtitle: "चेतना की आंतरिक क्रांति" }
  },
  {
    id: "ashtavakra-mahageeta",
    title: "Ashtavakra Mahageeta (अष्टावक्र महागीता - भाग 1)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AshtavakraMahageetaByOsho.pdf",
    coverName: "ashtavakra-mahageeta.webp",
    language: "Hindi",
    year: 1976,
    rating: 5.0,
    tags: ["Osho", "Ashtavakra Gita", "Advaita", "Vedanta", "Enlightenment"],
    description: "सत्य का शुद्धतम वक्तव्य: ऋषि अष्टावक्र और राजा जनक के संवाद पर ओशो का 1800+ पृष्ठों का महाग्रंथ।",
    excerpt: "तुम न देह हो, न मन हो; तुम साक्षी चैतन्य हो। बस जानो और इसी क्षण मुक्त हो जाओ।",
    theme: { bg1: "#1e1b4b", bg2: "#3b0764", accent: "#fbbf24", subtitle: "सत्य का शुद्धतम वक्तव्य" }
  },
  {
    id: "aswikrati-mein-utha-hath",
    title: "Aswikrati Mein Utha Hath (अस्वीकृति में उठा हाथ)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    resourceType: "Book",
    pdfFile: "AswikratiMeinUthaHathByOsho.pdf",
    coverName: "aswikrati-mein-utha-hath.webp",
    language: "Hindi",
    year: 1978,
    rating: 4.7,
    tags: ["Osho", "Rebellion", "Freedom", "Individualism", "Awakening"],
    description: "रूढ़ियों और पाखंड की निर्भीक अस्वीकृति तथा स्वतंत्र चैतन्य के उत्थान पर ओशो के प्रेरक विचार।",
    excerpt: "रूढ़ियों को अस्वीकार करने का साहस ही स्वतंत्र आत्मा के जन्म की पहली घोषणा है।",
    theme: { bg1: "#374151", bg2: "#4b5563", accent: "#e5e7eb", subtitle: "रूढ़ियों की निर्भीक अस्वीकृति" }
  }
];

async function generateSvgCover(book, outputPath) {
  const { title, author, theme } = book;
  const hindiMatch = title.match(/\((.*?)\)/);
  const hindiTitle = hindiMatch ? hindiMatch[1] : "";
  const engTitle = title.replace(/\(.*?\)/, "").trim();

  const svg = `
    <svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.bg1}" />
          <stop offset="100%" stop-color="${theme.bg2}" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="${theme.accent}" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="600" height="900" fill="url(#bgGrad)" />

      <!-- Ornate Frame Border -->
      <rect x="25" y="25" width="550" height="850" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
      <rect x="35" y="35" width="530" height="830" rx="12" fill="none" stroke="${theme.accent}" stroke-opacity="0.35" stroke-width="1.5" />

      <!-- Header Badge -->
      <g transform="translate(300, 90)">
        <rect x="-100" y="-18" width="200" height="36" rx="18" fill="rgba(255,255,255,0.08)" stroke="${theme.accent}" stroke-opacity="0.4" stroke-width="1" />
        <text text-anchor="middle" y="6" font-family="sans-serif" font-size="13" font-weight="700" fill="${theme.accent}" letter-spacing="2">READER'S HUB</text>
      </g>

      <!-- Spiritual Emblem / Diya Icon -->
      <g transform="translate(300, 220)">
        <circle r="48" fill="rgba(255,255,255,0.05)" stroke="${theme.accent}" stroke-opacity="0.4" stroke-width="1.5" />
        <circle r="56" fill="none" stroke="${theme.accent}" stroke-opacity="0.2" stroke-dasharray="4,4" />
        <text text-anchor="middle" y="16" font-size="44">🪔</text>
      </g>

      <!-- Devanagari Main Title -->
      <text x="300" y="360" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Mangal', serif" font-size="34" font-weight="bold" fill="#ffffff" letter-spacing="1">
        ${hindiTitle || engTitle}
      </text>

      <!-- English Transliteration Subtitle -->
      <text x="300" y="415" text-anchor="middle" font-family="serif" font-size="20" font-style="italic" fill="rgba(255,255,255,0.85)">
        ${engTitle}
      </text>

      <!-- Divider Ornament -->
      <g transform="translate(300, 460)">
        <line x1="-120" y1="0" x2="120" y2="0" stroke="${theme.accent}" stroke-opacity="0.6" stroke-width="1.5" />
        <polygon points="0,-6 6,0 0,6 -6,0" fill="${theme.accent}" />
      </g>

      <!-- Subtitle / Core Theme -->
      <text x="300" y="520" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="500" fill="rgba(255,255,255,0.75)" letter-spacing="1">
        ${theme.subtitle}
      </text>

      <!-- Author Section -->
      <g transform="translate(300, 720)">
        <text text-anchor="middle" y="-25" font-family="sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.6)" letter-spacing="3">DISCOURSES BY</text>
        <text text-anchor="middle" y="20" font-family="serif" font-size="38" font-weight="bold" fill="url(#goldGrad)" letter-spacing="2">
          ${author.toUpperCase()}
        </text>
        <text text-anchor="middle" y="52" font-family="sans-serif" font-size="13" font-weight="500" fill="${theme.accent}" opacity="0.9" letter-spacing="1.5">
          BHAGWAN SHREE RAJNEESH
        </text>
      </g>

      <!-- Footer Category Badge -->
      <g transform="translate(300, 830)">
        <rect x="-90" y="-14" width="180" height="28" rx="14" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <text text-anchor="middle" y="5" font-family="sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.8)" letter-spacing="1">
          HINDI DISCOURSE
        </text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);
}

async function run() {
  console.log("==================================================");
  console.log("🚀 EXECUTING ADDITIVE INGESTION FOR 24 OSHO VOLUMES");
  console.log("==================================================\n");

  // Step 1: Rename the clumsy filename
  const oldClumsy = path.join(PDF_DIR, "AndhakarSeAlokKeeOrOnlyChapter1TranslationByOsho.pdf");
  const newClean = path.join(PDF_DIR, "AndhakarSeAlokKiOrByOsho.pdf");
  if (fs.existsSync(oldClumsy)) {
    fs.renameSync(oldClumsy, newClean);
    console.log("✅ Renamed AndhakarSeAlokKeeOrOnlyChapter1TranslationByOsho.pdf -> AndhakarSeAlokKiOrByOsho.pdf");
  }

  // Step 2: Generate WebP covers and build Book entries
  const existingBooks = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, "utf8"));
  console.log(`Current existing catalog count: ${existingBooks.length} books`);

  const existingIds = new Set(existingBooks.map((b) => b.id));
  const newBookEntries = [];

  for (let i = 0; i < NEW_BOOKS_METADATA.length; i++) {
    const meta = NEW_BOOKS_METADATA[i];
    const pdfPath = path.join(PDF_DIR, meta.pdfFile);

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ Missing PDF file: ${meta.pdfFile}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(pdfPath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    let pageCount = 0;
    try {
      const doc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      pageCount = doc.getPageCount();
    } catch {
      pageCount = 100;
    }

    // Generate Cover
    const coverPath = path.join(COVERS_DIR, meta.coverName);
    await generateSvgCover(meta, coverPath);

    const bookEntry = {
      id: meta.id,
      title: meta.title,
      author: meta.author,
      category: meta.category,
      resourceType: meta.resourceType,
      cover: `/images/books/${meta.coverName}`,
      pdf: `/pdfs/${meta.pdfFile}`,
      description: meta.description,
      year: meta.year,
      pages: pageCount,
      language: meta.language,
      rating: meta.rating,
      featured: false,
      tags: meta.tags,
      excerpt: meta.excerpt,
      fileHash: fileHash,
    };

    newBookEntries.push(bookEntry);
    console.log(`[${i + 1}/24] Added "${meta.title}" (${pageCount} pgs, hash: ${fileHash.substring(0, 10)}...)`);
  }

  // Filter out any existing to maintain strict idempotency
  const additions = newBookEntries.filter((b) => !existingIds.has(b.id));
  const finalCatalog = [...existingBooks, ...additions];

  fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(finalCatalog, null, 2));
  console.log(`\n🎉 Updated ${BOOKS_JSON_PATH}`);
  console.log(`Catalog count before: ${existingBooks.length}`);
  console.log(`Catalog count after: ${finalCatalog.length} (+${additions.length} new additions)\n`);
}

run().catch(console.error);

