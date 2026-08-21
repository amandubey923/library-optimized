import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PDFDocument, PDFName, PDFDict, PDFStream } from "pdf-lib";
import sharp from "sharp";

export interface BookEntry {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  pdf: string;
  description: string;
  year: number | string;
  pages: number | string;
  language: string;
  rating: number;
  featured?: boolean;
  tags: string[];
  excerpt?: string;
  fileHash?: string;
  coverSource?: "curated" | "pdf-extracted" | "editorial-generated";
}

const PDF_DIR = path.join(process.cwd(), "public", "pdfs");
const THUMBNAIL_DIR = path.join(process.cwd(), "public", "images", "books");
const BOOKS_JSON_PATH = path.join(process.cwd(), "data", "books.json");

// Normalized dictionary for high-quality titles & authors
const KNOWN_METADATA: Record<string, { title: string; author: string; category: string; language?: string; year?: number; description?: string }> = {
  "1. complete dialogues plato.pdf": {
    title: "Complete Dialogues of Plato",
    author: "Plato",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: -375,
    description: "The complete philosophical dialogues of Plato, featuring Socrates discussing virtue, justice, wisdom, and the soul.",
  },
  "plato-complete-works.pdf": {
    title: "Complete Works of Plato",
    author: "Plato",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: -375,
    description: "A monumental collection of all dialogues and letters attributed to Plato, foundational to Western philosophical thought.",
  },
  "2. the republic-plato.pdf": {
    title: "The Republic",
    author: "Plato",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: -375,
    description: "Plato's Socratic dialogue concerning justice, the order and character of the just city-state, and the just human being.",
  },
  "3. nicomachean ethics-aristotles.pdf": {
    title: "Nicomachean Ethics",
    author: "Aristotle",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: -340,
    description: "Aristotle's masterwork on virtue ethics, exploring happiness (eudaimonia), moral virtue, and the highest human good.",
  },
  "4. letters from a stoic.pdf": {
    title: "Letters from a Stoic",
    author: "Seneca",
    category: "Philosophy & Spirituality",
    language: "Latin (Eng Trans)",
    year: 65,
    description: "Timeless moral essays and letters by Seneca the Younger on fortitude, friendship, mindfulness, and the tranquility of the mind.",
  },
  "5. the discourses of epictetus, with the encheiridion and fragments.pdf": {
    title: "Discourses and Selected Writings",
    author: "Epictetus",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: 108,
    description: "The practical Stoic teachings of Epictetus on freedom, inner control, detachment from circumstance, and rational living.",
  },
  "6. meditations of marcus aurelius.pdf": {
    title: "Meditations",
    author: "Marcus Aurelius",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: 180,
    description: "Personal Stoic reflections and spiritual exercises of Roman Emperor Marcus Aurelius on duty, nature, mortality, and virtue.",
  },
  "marcus-aurelius-meditations.pdf": {
    title: "Meditations (Stoic Reflections)",
    author: "Marcus Aurelius",
    category: "Philosophy & Spirituality",
    language: "Greek (Eng Trans)",
    year: 180,
    description: "The timeless spiritual journal of Roman Emperor Marcus Aurelius, offering insights into human purpose and tranquility.",
  },
  "7. meditations on first philosphy.pdf": {
    title: "Meditations on First Philosophy",
    author: "René Descartes",
    category: "Philosophy & Spirituality",
    language: "French (Eng Trans)",
    year: 1641,
    description: "Descartes' groundbreaking philosophical treatise examining epistemological skepticism, the cogito, and God.",
  },
  "8. an essay on human understanding.pdf": {
    title: "An Essay Concerning Human Understanding",
    author: "John Locke",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1689,
    description: "Foundational work of empiricism examining the foundation of human knowledge and the origins of ideas in experience.",
  },
  "9. a treatise of human nature.pdf": {
    title: "A Treatise of Human Nature",
    author: "David Hume",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1739,
    description: "David Hume's investigation into human psychology, empirical observation, skepticism, and moral philosophy.",
  },
  "10. prolegomena to any future metaphysics.pdf": {
    title: "Prolegomena to Any Future Metaphysics",
    author: "Immanuel Kant",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1783,
    description: "Kant's introductory overview to transcendental idealism, examining the synthetic a priori and the boundaries of reason.",
  },
  "11. critique of pure reason.pdf": {
    title: "Critique of Pure Reason",
    author: "Immanuel Kant",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1781,
    description: "Kant's magnum opus uniting rationalism and empiricism by analyzing the scope and limits of pure theoretical reason.",
  },
  "12. the world as will and representation.pdf": {
    title: "The World as Will and Representation",
    author: "Arthur Schopenhauer",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1818,
    description: "Schopenhauer's central metaphysical work presenting reality as blind cosmic striving ('Will') and human cognition ('Representation').",
  },
  "13. thus spoke zarathustra.pdf": {
    title: "Thus Spoke Zarathustra",
    author: "Friedrich Nietzsche",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1883,
    description: "Nietzsche's poetic philosophical masterpiece introducing the Übermensch, the Will to Power, and the Eternal Recurrence.",
  },
  "14. notes from the underground fyodor dostoy.pdf": {
    title: "Notes from the Underground",
    author: "Fyodor Dostoevsky",
    category: "Classics",
    language: "Russian (Eng Trans)",
    year: 1864,
    description: "The existential confession of an alienated narrator in Saint Petersburg exploring free will, suffering, and human irrationality.",
  },
  "16. the metamorphosis.pdf": {
    title: "The Metamorphosis",
    author: "Franz Kafka",
    category: "Classics",
    language: "German (Eng Trans)",
    year: 1915,
    description: "Gregor Samsa wakes one morning to discover himself transformed into a monstrous insect, examining alienation and familial burden.",
  },
  "17. the trial - franz kafka.pdf": {
    title: "The Trial",
    author: "Franz Kafka",
    category: "Classics",
    language: "German (Eng Trans)",
    year: 1925,
    description: "Josef K. is arrested and prosecuted by an inaccessible authority, with the nature of his crime never revealed.",
  },
  "18. the myth of sisyphus - albert camus.pdf": {
    title: "The Myth of Sisyphus",
    author: "Albert Camus",
    category: "Philosophy & Spirituality",
    language: "French (Eng Trans)",
    year: 1942,
    description: "Camus' philosophical essay on the absurd, suicide, and finding meaning in defiant conscious rebellion.",
  },
  "24. who_am_i_english.pdf": {
    title: "Who Am I? (Nan Yar?)",
    author: "Sri Ramana Maharshi",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1923,
    description: "Core spiritual dialogues and self-inquiry (Atma Vichara) teachings of the revered sage of Arunachala.",
  },
  "25. the spiritual teaching of ramana maharshi.pdf": {
    title: "The Spiritual Teaching of Ramana Maharshi",
    author: "Sri Ramana Maharshi",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1948,
    description: "Essential conversations and direct spiritual guidance on non-dual realization and self-abidance.",
  },
  "atomic habits.pdf": {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Development & Psychology",
    language: "English",
    year: 2018,
    description: "A proven framework for improving every day through tiny 1% daily habits, habit stacking, and identity-based change.",
  },
  "deep work_ rules for focused success in a distracted world - on bookdio.org.pdf": {
    title: "Deep Work: Rules for Focused Success",
    author: "Cal Newport",
    category: "Self-Development & Psychology",
    language: "English",
    year: 2016,
    description: "The ability to focus without distraction on a cognitively demanding task is a superpower in our distracted knowledge economy.",
  },
  "eric-jorgenson_the-almanack-of-naval-ravikant_final.pdf": {
    title: "The Almanack of Naval Ravikant",
    author: "Eric Jorgenson & Naval Ravikant",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 2020,
    description: "A guide to wealth, judgment, specific knowledge, and happiness gathered from the wisdom of entrepreneur Naval Ravikant.",
  },
  "extreme ownership.pdf": {
    title: "Extreme Ownership: How U.S. Navy SEALs Lead and Win",
    author: "Jocko Willink & Leif Babin",
    category: "Self-Development & Psychology",
    language: "English",
    year: 2015,
    description: "Combat leadership principles applied to business and life, centered on taking absolute responsibility for all outcomes.",
  },
  "freedom from the known - j. krishnamurti.pdf": {
    title: "Freedom from the Known",
    author: "J. Krishnamurti",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1969,
    description: "Krishnamurti explores radical liberation from psychological conditioning, fear, authority, and thought.",
  },
  "how to win friends and influence people - carnegie, dale.pdf": {
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1936,
    description: "The timeless bestseller on interpersonal relations, empathetic leadership, genuine appreciation, and communication.",
  },
  "daniel kahneman-thinking, fast and slow  .pdf": {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Self-Development & Psychology",
    language: "English",
    year: 2011,
    description: "Nobel laureate Daniel Kahneman explores the two systems of mind: System 1 (fast/intuitive) and System 2 (slow/deliberative).",
  },
  "rich dad poor dad.pdf": {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    category: "Business, Finance & Economics",
    language: "English",
    year: 1997,
    description: "What the rich teach their kids about money that the poor and middle class do not — assets, cash flow, and financial literacy.",
  },
  "the $100 startup - chris guillebeau.pdf": {
    title: "The $100 Startup",
    author: "Chris Guillebeau",
    category: "Business, Finance & Economics",
    language: "English",
    year: 2012,
    description: "Reinvent the way you make a living, do what you love, and create a new future with minimal initial investment.",
  },
  "the 7 habits of highly effective people.pdf": {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1989,
    description: "A holistic, integrated principle-centered approach for solving personal and professional problems.",
  },
  "the alchemist.pdf": {
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Classics",
    language: "Portuguese (Eng Trans)",
    year: 1988,
    description: "The inspiring fable of Santiago, an Andalusian shepherd boy who journeys in search of worldly treasure and his Personal Legend.",
  },
  "the fountainhead.pdf": {
    title: "The Fountainhead",
    author: "Ayn Rand",
    category: "Fiction & Dystopian",
    language: "English",
    year: 1943,
    description: "The story of uncompromising modernist architect Howard Roark and his battle against collectivist conformity.",
  },
  "the hard thing about hard things.pdf": {
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    category: "Business, Finance & Economics",
    language: "English",
    year: 2014,
    description: "Silicon Valley venture capitalist Ben Horowitz offers brutal honesty and practical advice on running a startup through crisis.",
  },
  "the lean startup - erick ries.pdf": {
    title: "The Lean Startup",
    author: "Eric Ries",
    category: "Business, Finance & Economics",
    language: "English",
    year: 2011,
    description: "How today's entrepreneurs use continuous innovation, rapid experimentation, and validated learning to build successful companies.",
  },
  "the magic of thinking big.pdf": {
    title: "The Magic of Thinking Big",
    author: "David J. Schwartz",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1959,
    description: "Acquire the secrets of setting high goals and developing the belief needed to exceed expectations.",
  },
  "the psychology of money-morgan house.pdf": {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Business, Finance & Economics",
    language: "English",
    year: 2020,
    description: "Timeless lessons on wealth, greed, ego, and happiness exploring how people think and behave around money.",
  },
  "theteachingofbuddha.pdf": {
    title: "The Teaching of Buddha",
    author: "Bukkyo Dendo Kyokai",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1966,
    description: "The essence of Buddhist scriptures, the Four Noble Truths, the Noble Eightfold Path, and the cessation of suffering.",
  },
  "think and grow rich.pdf": {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1937,
    description: "The classic philosophy of personal achievement based on research into the habits of the most prosperous individuals.",
  },
  "total freedom. the essential krishnamurti.pdf": {
    title: "Total Freedom: The Essential Krishnamurti",
    author: "J. Krishnamurti",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1996,
    description: "The definitive collection of J. Krishnamurti's core discourses on consciousness, love, meditation, and total freedom.",
  },
  "zero to one.pdf": {
    title: "Zero to One: Notes on Startups",
    author: "Peter Thiel & Blake Masters",
    category: "Business, Finance & Economics",
    language: "English",
    year: 2014,
    description: "How to build companies that create new things, moving from 0 to 1 through breakthrough innovation and vertical progress.",
  },
  "wings of fire.pdf": {
    title: "Wings of Fire: An Autobiography",
    author: "Dr. A.P.J. Abdul Kalam",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1999,
    description: "The inspiring journey of India's 'Missile Man' and former President from humble origins in Rameswaram to pioneering science.",
  },
  "tao te ching lao tzu.pdf": {
    title: "Tao Te Ching",
    author: "Lao Tzu",
    category: "Philosophy & Spirituality",
    language: "Chinese (Eng Trans)",
    year: -400,
    description: "The ancient Chinese classic on harmony, natural simplicity (Wu Wei), virtue, and aligning with the flow of the universe.",
  },
  "origin of species-charles darwin.pdf": {
    title: "On the Origin of Species",
    author: "Charles Darwin",
    category: "Classics",
    language: "English",
    year: 1859,
    description: "Darwin's revolutionary foundation of evolutionary biology, explaining natural selection and the diversity of life.",
  },
  "rajayoga1920.pdf": {
    title: "Raja Yoga",
    author: "Swami Vivekananda",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1896,
    description: "Swami Vivekananda's profound exposition on Patanjali's Yoga Sutras, meditation, concentration, and psychic control.",
  },
  "karmayoga(vivekanand).pdf": {
    title: "Karma Yoga: The Yoga of Action",
    author: "Swami Vivekananda",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1896,
    description: "The science of work without attachment, dedicated to selflessness and the realization of divine divinity within.",
  },
  "karma.pdf": {
    title: "Karma: A Yogi's Guide to Crafting Your Destiny",
    author: "Sadhguru",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 2021,
    description: "A transformative exploration into the mechanics of karma and how conscious action allows you to shape your destiny.",
  },
  "siddhartha by hermann hesse.pdf": {
    title: "Siddhartha",
    author: "Hermann Hesse",
    category: "Classics",
    language: "German (Eng Trans)",
    year: 1922,
    description: "The spiritual journey of self-discovery, river wisdom, and ultimate enlightenment during the time of the Gautama Buddha.",
  },
  "sopaan - harivansh rai bachchan.pdf": {
    title: "Sopaan (सोपान)",
    author: "Harivansh Rai Bachchan",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1953,
    description: "A celebrated collection of reflective lyrical Hindi poetry by the legendary author of Madhushala.",
  },
  "kalidasa.pdf": {
    title: "Works of Kalidasa (Abhijnanasakuntalam & Meghaduta)",
    author: "Kalidasa",
    category: "Hindi Literature",
    language: "Sanskrit (Hindi/Eng)",
    year: 400,
    description: "The master dramas and poetry of classical India's greatest playwright and poet Kalidasa.",
  },
  "kabir-sahab.pdf": {
    title: "Kabir Sahab: Bijak & Sakhi",
    author: "Sant Kabir Das",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1450,
    description: "The mystical verses and direct spiritual teachings of Sant Kabir, piercing dogmatism with truth and devotion.",
  },
  "kabir all doha combined.pdf": {
    title: "Kabir Ke Sampoorna Dohe (कबीर के दोहे)",
    author: "Sant Kabir Das",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1450,
    description: "Comprehensive collection of Kabir's timeless rhyming couplets on wisdom, equality, devotion, and inner realization.",
  },
  "kabir ka kavya.pdf": {
    title: "Kabir Ka Kavya (कबीर का काव्य)",
    author: "Sant Kabir Das",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1450,
    description: "Literary and spiritual anthology celebrating the poetic genius and profound wisdom of Sant Kabir.",
  },
  "कबीर के दोहे  kabir ke dohe in hindi with meaning.pdf": {
    title: "Kabir Ke Dohe with Meaning (कबीर के दोहे अर्थ सहित)",
    author: "Sant Kabir Das",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1450,
    description: "Complete collection of Kabir Das couplets with accessible Hindi commentary and philosophical meanings.",
  },
  "गोस्वामी तुलसीदास के दोहे.pdf": {
    title: "Tulsidas Ke Dohe (गोस्वामी तुलसीदास के दोहे)",
    author: "Goswami Tulsidas",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1576,
    description: "Devotional wisdom, ethics, and moral couplets by the revered author of Ramcharitmanas.",
  },
  "रहीम के दोहे - rahim das ke dohe with meaning in hindi.pdf": {
    title: "Rahim Ke Dohe (रहीम के दोहे अर्थ सहित)",
    author: "Abdul Rahim Khan-i-Khana",
    category: "Hindi Literature",
    language: "Hindi",
    year: 1600,
    description: "Practical worldly wisdom, humility, and devotional couplets by the celebrated medieval poet Rahim.",
  },
  "अष्टावक्र_गीता_भाष्य_2023_प्रकरण_1_2 - converted.pdf": {
    title: "Ashtavakra Gita Bhashya (Vol 1)",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2023,
    description: "An illuminating contemporary commentary on the highest non-dual wisdom of Ashtavakra Gita.",
  },
  "अष्टावक्र_गीता_भाष्य_2023_प्रकरण_3_6 - converted.pdf": {
    title: "Ashtavakra Gita Bhashya (Vol 2)",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2023,
    description: "Deep verse-by-verse exploration into consciousness, witness awareness, and inner stillness.",
  },
  "कठ_उपनिषद्_आचार्य_प्रशांत - converted.pdf": {
    title: "Katha Upanishad Bhashya (कठ उपनिषद्)",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2022,
    description: "The dialogue between young Nachiketa and Yama on the mystery of death, immortality, and the eternal Self.",
  },
  "constitution of india.pdf": {
    title: "Constitution of India (Official English Edition)",
    author: "Dr. B.R. Ambedkar & Drafting Committee",
    category: "Classics",
    language: "English",
    year: 1950,
    description: "The supreme law of India, establishing the framework of government, fundamental rights, and democratic principles.",
  },
  "constitution hindi.pdf": {
    title: "Constitution of India (भारतीय संविधान)",
    author: "Dr. B.R. Ambedkar & Drafting Committee",
    category: "Classics",
    language: "Hindi",
    year: 1950,
    description: "The supreme constitutional document of the Republic of India in authentic Hindi translation.",
  },
  "br ambedkar budha.pdf": {
    title: "The Buddha and His Dhamma",
    author: "Dr. B.R. Ambedkar",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1957,
    description: "Dr. B.R. Ambedkar's monumental treatise on the life, philosophy, rationality, and ethics of Gautama Buddha.",
  },
  "ambekar-life-mission.pdf": {
    title: "Dr. Ambedkar: Life and Mission",
    author: "Dhananjay Keer",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1954,
    description: "The definitive biography of Dr. B.R. Ambedkar, chronicling his monumental crusade for social equality.",
  },
  "my autobiography - br ambedkar.pdf": {
    title: "Waiting for a Visa (Autobiographical Notes)",
    author: "Dr. B.R. Ambedkar",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1936,
    description: "Dr. B.R. Ambedkar's poignant autobiographical memoir chronicling his experiences with untouchability.",
  },
  "osho_rajneesh_tao_upanishad_bhag_1.pdf": {
    title: "Tao Upanishad (Part 1)",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 1975,
    description: "Osho's profound Hindi discourses unveiling the wisdom of Lao Tzu and the Upanishadic insights.",
  },
  "the_osho_upanishad_osho.pdf": {
    title: "The Osho Upanishad",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1986,
    description: "Spontaneous discourses on meditation, love, freedom, and the art of living consciously in the present moment.",
  },
  "osho - the book of secrets.pdf": {
    title: "The Book of Secrets: 112 Meditations",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1974,
    description: "The comprehensive guide to the 112 classical meditation techniques of Vigyan Bhairav Tantra.",
  },
  "courage_the_joy_of_living_dangerously_-_osho.pdf": {
    title: "Courage: The Joy of Living Dangerously",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1999,
    description: "An invitation to live life with total authenticity, stepping into the unknown with confidence.",
  },
  "maturity-osho.pdf": {
    title: "Maturity: The Responsibility of Being Oneself",
    author: "Osho",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1999,
    description: "Insights on growing up rather than merely growing old, discovering inner independence and wisdom.",
  },
  "creativity-osho.pdf": {
    title: "Creativity: Unleashing the Forces Within",
    author: "Osho",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1999,
    description: "How to unlock true creative energy through meditation, presence, and expressive courage.",
  },
  "intuition knowing beyond logic-osho.pdf": {
    title: "Intuition: Knowing Beyond Logic",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 2001,
    description: "Understanding the bridge between instinct, intellect, and the higher dimension of intuitive knowing.",
  },
  "medication to meditation_osho.pdf": {
    title: "Medication to Meditation",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 2002,
    description: "Holistic perspectives on healing the body, calming the mind, and awakening inner health.",
  },
  "alfaaz-ki-mehfil-.pdf": {
    title: "Alfaaz Ki Mehfil (अल्फ़ाज़ की महफ़िल)",
    author: "Reader's HUB Anthology",
    category: "Hindi Literature",
    language: "Hindi / Urdu",
    year: 2024,
    description: "A soulful poetic anthology collecting timeless Ghazals, Nazms, and verses from celebrated Indian poets.",
  },
  "the-art-of-war.pdf": {
    title: "The Art of War",
    author: "Sun Tzu",
    category: "Philosophy & Spirituality",
    language: "Chinese (Eng Trans)",
    year: -500,
    description: "The ancient military treatise on strategy, tactical wisdom, deception, and victory without conflict.",
  },
  "georg wilhelm friedrich hegel - the phenomenology of spirit (terry pinkard translation).pdf": {
    title: "The Phenomenology of Spirit",
    author: "Georg Wilhelm Friedrich Hegel",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1807,
    description: "Hegel's masterwork exploring consciousness, self-consciousness, reason, spirit, religion, and absolute knowing.",
  },
  "groundwork of the metaphysics of morals.pdf": {
    title: "Groundwork of the Metaphysics of Morals",
    author: "Immanuel Kant",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1785,
    description: "Kant's foundational work on moral philosophy and the Categorical Imperative.",
  },
  "critique of practical reason.pdf": {
    title: "Critique of Practical Reason",
    author: "Immanuel Kant",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1788,
    description: "Kant's second critique addressing moral philosophy, duty, the moral law within, and practical freedom.",
  },
  "critique of judgment - immanuel kant.pdf": {
    title: "Critique of Judgment",
    author: "Immanuel Kant",
    category: "Philosophy & Spirituality",
    language: "German (Eng Trans)",
    year: 1790,
    description: "Kant's investigation into aesthetics, the beautiful, the sublime, and teleological judgment.",
  },
  "mans-search-for-meaning.pdf": {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    category: "Self-Development & Psychology",
    language: "German (Eng Trans)",
    year: 1946,
    description: "Psychiatrist Viktor Frankl's memoir of surviving Auschwitz and developing Logotherapy — finding purpose even in deep suffering.",
  },
  "bhagwad geeta part-1 acharya ji.pdf": {
    title: "Bhagavad Gita: The Song of Freedom (Vol 1)",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2021,
    description: "A revolutionary contemporary commentary on Krishna's eternal counsel to Arjuna on Kurukshetra.",
  },
  "bhagwad geeta  part-2 acharya ji.pdf": {
    title: "Bhagavad Gita: The Song of Freedom (Vol 2)",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2021,
    description: "Deep spiritual guidance on Nishkama Karma, self-knowledge, and unconditioned living.",
  },
  "budha.pdf": {
    title: "The Buddha and His Teachings",
    author: "Ven. Narada Mahathera",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1980,
    description: "A classic exposition of the Dhamma, kamma, rebirth, meditation, and Nibbana.",
  },
  "the discipline of transcendence, osho.pdf": {
    title: "The Discipline of Transcendence",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1978,
    description: "Discourses on the 42 Sutras of Gautama Buddha, exploring mindfulness and inner awakening.",
  },
  "the mysteries of life and death (scan).pdf": {
    title: "The Mysteries of Life and Death",
    author: "Swami Sivananda",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1949,
    description: "Profound yogic wisdom and philosophical insights into the soul, karma, transmigration, and immortality.",
  },
  "osho-source-book.pdf": {
    title: "The Osho Source Book",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1985,
    description: "An encyclopedic resource of Osho's life, meditation methods, discourses, and ashram history.",
  },
  "constitution of india 2.pdf": {
    title: "The Constitution of India (Illustrated Edition)",
    author: "Dr. B.R. Ambedkar & Drafting Committee",
    category: "Classics",
    language: "English",
    year: 1950,
    description: "The supreme legal charter of the Republic of India adorned with classical artwork.",
  },
  "oshoreply.pdf": {
    title: "The Secret of Meditation: Questions & Answers",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1982,
    description: "Spontaneous answers to seekers exploring dynamic meditation, presence, and awareness.",
  },
  "newport - so good they can't ignore you.pdf": {
    title: "So Good They Can't Ignore You",
    author: "Cal Newport",
    category: "Self-Development & Psychology",
    language: "English",
    year: 2012,
    description: "Why skills trump passion in the quest for work you love — cultivating the craftsman mindset.",
  },
  "advait in everyday life by acharya prashant.pdf": {
    title: "Advaita in Everyday Life",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi / English",
    year: 2022,
    description: "Applying non-dual Upanishadic wisdom to daily relationships, work, mind, and spiritual clarity.",
  },
  "advait in everyday life.pdf": {
    title: "Advaita in Everyday Life",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi / English",
    year: 2022,
    description: "Applying non-dual Upanishadic wisdom to daily relationships, work, mind, and spiritual clarity.",
  },
  "ananda-acharya prashant.pdf": {
    title: "Ananda: Joy Beyond Pleasure",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2021,
    description: "Understanding the distinction between fleeting worldly pleasure and enduring spiritual bliss.",
  },
  "acharya prashant - upanishad mahavakya(www.the-gyan.in) (3).pdf": {
    title: "Upanishad Mahavakya (उपनिषद् महावाक्य)",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi",
    year: 2022,
    description: "Deep commentary on the four great Vedic pronouncements revealing non-dual reality.",
  },
  "be_still_and know.pdf": {
    title: "Be Still and Know",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1980,
    description: "Talks on the power of silence, witnessing consciousness, and dissolving psychological noise.",
  },
  "bertrand russell - the conquest of happiness-liveright (1996).pdf": {
    title: "The Conquest of Happiness",
    author: "Bertrand Russell",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1930,
    description: "Philosopher Bertrand Russell diagnoses the causes of unhappiness and prescribes rational paths to joy.",
  },
  "decoding success.pdf": {
    title: "Decoding Success: Know Before Chasing",
    author: "Acharya Prashant",
    category: "Self-Development & Psychology",
    language: "English",
    year: 2021,
    description: "A penetrating inquiry into what true success and meaningful fulfillment really signify.",
  },
  "the magic of self respect awakening-osho.pdf": {
    title: "The Magic of Self-Respect",
    author: "Osho",
    category: "Self-Development & Psychology",
    language: "English",
    year: 1998,
    description: "Awakening your own awareness and discovering self-dignity free from social approval.",
  },
  "truth without apology.pdf": {
    title: "Truth Without Apology",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 2022,
    description: "Uncompromising clarity and direct spiritual guidance on dismantling illusions.",
  },
  "take it really seriously-osho.pdf": {
    title: "Take It Really Seriously",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1981,
    description: "Insights on approaching spiritual transformation and meditation with joyful intensity.",
  },
  "meditation 247t.pdf": {
    title: "Meditation 24*7",
    author: "Acharya Prashant",
    category: "Philosophy & Spirituality",
    language: "Hindi / English",
    year: 2021,
    description: "Living every moment from a space of mindfulness, clarity, and meditative awareness.",
  },
  "meditation_ the first and last freedom(osho).pdf": {
    title: "Meditation: The First and Last Freedom",
    author: "Osho",
    category: "Philosophy & Spirituality",
    language: "English",
    year: 1988,
    description: "A practical guide to 60 meditation techniques for modern seekers in daily life.",
  }
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTitleAndAuthor(filename: string): { title: string; author: string } {
  let raw = path.basename(filename, path.extname(filename));

  raw = raw.replace(/^\d+[\.\-\s_]+/, "").trim();
  raw = raw.replace(/- on Bookdio\.org/i, "");
  raw = raw.replace(/\(Terry Pinkard Translation\)/i, "");
  raw = raw.replace(/\(www\.the-Gyan\.in\)/i, "");
  raw = raw.replace(/- converted/i, "");
  raw = raw.replace(/_Final/i, "");
  raw = raw.replace(/\s*\(\d+\)$/, "");
  raw = raw.replace(/_-\s*/g, " - ");
  raw = raw.replace(/_/g, " ").trim();

  let author = "Unknown Author";
  let title = raw;

  if (raw.includes(" - ")) {
    const parts = raw.split(" - ").map((p) => p.trim());
    if (parts.length >= 2) {
      title = parts[0];
      author = parts[1];
    }
  } else if (raw.toLowerCase().includes(" by ")) {
    const parts = raw.split(/ by /i).map((p) => p.trim());
    if (parts.length >= 2) {
      title = parts[0];
      author = parts[1];
    }
  } else if (raw.toLowerCase().includes(" (vivekanand)")) {
    title = raw.replace(/\s*\(vivekanand\)/i, "").trim();
    author = "Swami Vivekananda";
  } else if (raw.toLowerCase().includes("(osho)") || raw.toLowerCase().includes("-osho")) {
    title = raw.replace(/[-_]?\s*\(?osho\)?/i, "").trim();
    author = "Osho";
  }

  return { title: title.trim(), author: author.trim() };
}

function detectCategory(title: string, author: string, context: string): string {
  const content = `${title} ${author} ${context}`.toLowerCase();

  if (
    /[\u0900-\u097F]/.test(content) ||
    content.includes("premchand") ||
    content.includes("bachchan") ||
    content.includes("doha") ||
    content.includes("kabir") ||
    content.includes("tulsidas") ||
    content.includes("rahim") ||
    content.includes("kalidasa") ||
    content.includes("alfaaz") ||
    content.includes("hindi")
  ) {
    return "Hindi Literature";
  }

  if (
    content.includes("money") ||
    content.includes("startup") ||
    content.includes("rich dad") ||
    content.includes("zero to one") ||
    content.includes("hard thing") ||
    content.includes("lean startup") ||
    content.includes("finance") ||
    content.includes("wealth") ||
    content.includes("business")
  ) {
    return "Business, Finance & Economics";
  }

  if (
    content.includes("habits") ||
    content.includes("deep work") ||
    content.includes("win friends") ||
    content.includes("thinking, fast") ||
    content.includes("7 habits") ||
    content.includes("extreme ownership") ||
    content.includes("wings of fire") ||
    content.includes("thinking big") ||
    content.includes("psychology") ||
    content.includes("self-development")
  ) {
    return "Self-Development & Psychology";
  }

  if (
    content.includes("plato") ||
    content.includes("aristotle") ||
    content.includes("stoic") ||
    content.includes("seneca") ||
    content.includes("epictetus") ||
    content.includes("marcus aurelius") ||
    content.includes("meditations") ||
    content.includes("kant") ||
    content.includes("schopenhauer") ||
    content.includes("nietzsche") ||
    content.includes("descartes") ||
    content.includes("hume") ||
    content.includes("buddha") ||
    content.includes("osho") ||
    content.includes("upanishad") ||
    content.includes("geeta") ||
    content.includes("gita") ||
    content.includes("krishnamurti") ||
    content.includes("tao") ||
    content.includes("yoga") ||
    content.includes("maharshi") ||
    content.includes("prashant") ||
    content.includes("advait") ||
    content.includes("spirituality") ||
    content.includes("philosophy")
  ) {
    return "Philosophy & Spirituality";
  }

  if (
    content.includes("1984") ||
    content.includes("dystopia") ||
    content.includes("fountainhead") ||
    content.includes("cyber")
  ) {
    return "Fiction & Dystopian";
  }

  if (
    content.includes("ring") ||
    content.includes("dragon") ||
    content.includes("hobbit") ||
    content.includes("quest")
  ) {
    return "Fantasy & Adventure";
  }

  if (
    content.includes("love") ||
    content.includes("romance") ||
    content.includes("heart") ||
    content.includes("girlfriend")
  ) {
    return "Romance";
  }

  return "Classics";
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// -------------------------------------------------------------
// PRIORITY 2: EXTRACT REAL COVER IMAGE DIRECTLY FROM PDF
// -------------------------------------------------------------
async function tryExtractPdfCover(pdfPath: string, outputPath: string): Promise<boolean> {
  try {
    const bytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const context = pdfDoc.context;
    const pages = pdfDoc.getPages();

    // Inspect first 5 pages for a full-page cover image
    for (let i = 0; i < Math.min(5, pages.length); i++) {
      const page = pages[i];
      const resources = page.node.Resources();
      if (!resources) continue;
      const xObject = resources.get(PDFName.of("XObject"));
      if (!xObject || !(xObject instanceof PDFDict)) continue;

      const entries = xObject.entries();
      for (const [, ref] of entries) {
        const obj = context.lookup(ref);
        if (obj instanceof PDFStream) {
          const subtype = obj.dict.get(PDFName.of("Subtype"));
          if (subtype === PDFName.of("Image")) {
            const filter = obj.dict.get(PDFName.of("Filter"));
            const widthObj = obj.dict.get(PDFName.of("Width")) as any;
            const heightObj = obj.dict.get(PDFName.of("Height")) as any;
            const width = typeof widthObj?.asNumber === "function" ? widthObj.asNumber() : widthObj?.numberValue || 0;
            const height = typeof heightObj?.asNumber === "function" ? heightObj.asNumber() : heightObj?.numberValue || 0;

            // Only consider substantial images that could be book covers
            if (width && height && width >= 250 && height >= 350) {
              const rawBytes = obj.getContents();
              try {
                // If it's DCTDecode (JPEG stream) or Sharp can decode the raw image buffer
                await sharp(Buffer.from(rawBytes))
                  .resize(600, 900, { fit: "cover", position: "center" })
                  .webp({ quality: 90 })
                  .toFile(outputPath);

                return true;
              } catch {
                // Buffer wasn't direct raster, continue searching
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // PDF extraction fallback
  }
  return false;
}

// -------------------------------------------------------------
// PRIORITY 3: MULTI-FAMILY DISTINCT EDITORIAL COVER GENERATOR
// -------------------------------------------------------------
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3); // Max 3 lines
}

async function generateDistinctEditorialCover(
  title: string,
  author: string,
  category: string,
  outputPath: string
): Promise<void> {
  const width = 600;
  const height = 900;

  // Hash-derived deterministic seed for unique visual variation
  const hash = crypto.createHash("sha256").update(title + author).digest("hex");
  const seed = parseInt(hash.slice(0, 8), 16);

  const safeTitle = escapeXml(title);
  const safeAuthor = escapeXml(author);
  const safeCategory = escapeXml(category.toUpperCase());

  // Wrap title lines cleanly
  const titleLines = wrapText(safeTitle, 20);
  const titleFontSize = titleLines.length === 1 ? 44 : titleLines.length === 2 ? 38 : 32;
  const titleLineHeight = titleFontSize * 1.25;
  const titleStartY = 430 - ((titleLines.length - 1) * titleLineHeight) / 2;

  // 7 Distinct Design Families based on Category and Seed
  let bgGradient = "";
  let accentColor = "";
  let secondaryAccent = "";
  let frameElement = "";
  let motifElement = "";
  let fontStyle = "serif";

  if (category === "Philosophy & Spirituality") {
    // Family 1: Deep Marble, Slate, Imperial Ochre
    const palettes = [
      { bg1: "#0f141c", bg2: "#080a0f", accent: "#fbbf24", sec: "#d97706", glow: "#f59e0b" },
      { bg1: "#141724", bg2: "#0a0c14", accent: "#38bdf8", sec: "#0284c7", glow: "#0ea5e9" },
      { bg1: "#121816", bg2: "#070c0a", accent: "#34d399", sec: "#059669", glow: "#10b981" },
    ];
    const p = palettes[seed % palettes.length];
    bgGradient = `
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="60%" stop-color="${p.bg2}"/>
        <stop offset="100%" stop-color="#040507"/>
      </linearGradient>
      <radialGradient id="amb" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    `;
    accentColor = p.accent;
    secondaryAccent = p.sec;
    frameElement = `
      <rect x="30" y="30" width="540" height="840" rx="12" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.4" />
      <rect x="42" y="42" width="516" height="816" rx="8" fill="none" stroke="#2c364c" stroke-width="1" />
      <circle cx="300" cy="220" r="48" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6"/>
      <circle cx="300" cy="220" r="32" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.8"/>
      <circle cx="300" cy="220" r="5" fill="${accentColor}"/>
    `;
    fontStyle = "serif";
  } else if (category === "Hindi Literature") {
    // Family 2: Saffron Ochre, Deep Maroon, Terracotta Temple
    const palettes = [
      { bg1: "#1f1008", bg2: "#100603", accent: "#f97316", sec: "#ea580c", glow: "#fb923c" },
      { bg1: "#1c0d15", bg2: "#0d040a", accent: "#f43f5e", sec: "#be123c", glow: "#fb7185" },
      { bg1: "#19150b", bg2: "#0a0804", accent: "#eab308", sec: "#ca8a04", glow: "#fde047" },
    ];
    const p = palettes[seed % palettes.length];
    bgGradient = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="70%" stop-color="${p.bg2}"/>
        <stop offset="100%" stop-color="#050201"/>
      </linearGradient>
      <radialGradient id="amb" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    `;
    accentColor = p.accent;
    secondaryAccent = p.sec;
    frameElement = `
      <rect x="25" y="25" width="550" height="850" rx="16" fill="none" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.5" />
      <path d="M 60,60 L 120,60 M 60,60 L 60,120" stroke="${accentColor}" stroke-width="3" />
      <path d="M 540,60 L 480,60 M 540,60 L 540,120" stroke="${accentColor}" stroke-width="3" />
      <path d="M 60,840 L 120,840 M 60,840 L 60,780" stroke="${accentColor}" stroke-width="3" />
      <path d="M 540,840 L 480,840 M 540,840 L 540,780" stroke="${accentColor}" stroke-width="3" />
      <!-- Lotus Mandala Motif -->
      <g transform="translate(300, 210) scale(0.9)">
        <polygon points="0,-40 12,-12 40,0 12,12 0,40 -12,12 -40,0 -12,-12" fill="${accentColor}" opacity="0.85"/>
        <circle cx="0" cy="0" r="14" fill="#1f1008" stroke="${accentColor}" stroke-width="1.5"/>
      </g>
    `;
    fontStyle = "serif";
  } else if (category === "Self-Development & Psychology") {
    // Family 3: Swiss Modernist, Electric Amber & Cobalt
    const palettes = [
      { bg1: "#0e131f", bg2: "#070a12", accent: "#38bdf8", sec: "#0ea5e9", glow: "#7dd3fc" },
      { bg1: "#141722", bg2: "#090b10", accent: "#f59e0b", sec: "#d97706", glow: "#fbbf24" },
      { bg1: "#0b1716", bg2: "#050d0c", accent: "#2dd4bf", sec: "#0d9488", glow: "#5eead4" },
    ];
    const p = palettes[seed % palettes.length];
    bgGradient = `
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </linearGradient>
      <radialGradient id="amb" cx="20%" cy="20%" r="70%">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    `;
    accentColor = p.accent;
    secondaryAccent = p.sec;
    frameElement = `
      <line x1="60" y1="0" x2="60" y2="900" stroke="${accentColor}" stroke-width="3" opacity="0.7"/>
      <circle cx="300" cy="220" r="60" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.4"/>
      <circle cx="300" cy="220" r="30" fill="${accentColor}" opacity="0.8"/>
    `;
    fontStyle = "sans-serif";
  } else if (category === "Business, Finance & Economics") {
    // Family 4: Wall Street Midnight & Emerald/Bronze
    const palettes = [
      { bg1: "#0a1412", bg2: "#040a09", accent: "#10b981", sec: "#059669", glow: "#34d399" },
      { bg1: "#12141a", bg2: "#08090d", accent: "#e2e8f0", sec: "#94a3b8", glow: "#60a5fa" },
      { bg1: "#17140e", bg2: "#0a0805", accent: "#fbbf24", sec: "#d97706", glow: "#f59e0b" },
    ];
    const p = palettes[seed % palettes.length];
    bgGradient = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </linearGradient>
      <radialGradient id="amb" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    `;
    accentColor = p.accent;
    secondaryAccent = p.sec;
    frameElement = `
      <rect x="35" y="35" width="530" height="830" rx="4" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.6"/>
      <line x1="35" y1="160" x2="565" y2="160" stroke="${accentColor}" stroke-width="1" opacity="0.3"/>
      <!-- Diamond Grid Matrix -->
      <g transform="translate(300, 230)">
        <polygon points="0,-25 25,0 0,25 -25,0" fill="none" stroke="${accentColor}" stroke-width="2"/>
        <polygon points="0,-12 12,0 0,12 -12,0" fill="${accentColor}"/>
      </g>
    `;
    fontStyle = "sans-serif";
  } else {
    // Family 5: Classics, World Literature & Fiction
    const palettes = [
      { bg1: "#17111a", bg2: "#0a070c", accent: "#fb7185", sec: "#e11d48", glow: "#fda4af" },
      { bg1: "#121722", bg2: "#080b12", accent: "#f59e0b", sec: "#d97706", glow: "#fbbf24" },
      { bg1: "#0b1616", bg2: "#050d0d", accent: "#2dd4bf", sec: "#0d9488", glow: "#5eead4" },
    ];
    const p = palettes[seed % palettes.length];
    bgGradient = `
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </linearGradient>
      <radialGradient id="amb" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    `;
    accentColor = p.accent;
    secondaryAccent = p.sec;
    frameElement = `
      <rect x="30" y="30" width="540" height="840" rx="16" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.45"/>
      <rect x="45" y="45" width="510" height="810" rx="12" fill="none" stroke="#2b3448" stroke-width="1"/>
      <g transform="translate(300, 220)">
        <circle cx="0" cy="0" r="36" fill="none" stroke="${accentColor}" stroke-width="1.5"/>
        <polygon points="0,-24 16,16 -16,16" fill="${accentColor}" opacity="0.85"/>
      </g>
    `;
    fontStyle = "serif";
  }

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${bgGradient}
      </defs>

      <!-- Background with Rich Vignette -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#amb)"/>

      <!-- Unique Frame & Insignia -->
      ${frameElement}

      <!-- Category Pill -->
      <g transform="translate(300, 110)">
        <rect x="-110" y="-15" width="220" height="30" rx="15" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.5"/>
        <text x="0" y="5" font-family="sans-serif" font-size="11" font-weight="bold" fill="${accentColor}" text-anchor="middle" letter-spacing="2">
          ${safeCategory}
        </text>
      </g>

      <!-- Title Lines (Auto-wrapped and centered) -->
      ${titleLines
        .map(
          (line, index) =>
            `<text x="300" y="${titleStartY + index * titleLineHeight}" font-family="${fontStyle}" font-size="${titleFontSize}" font-weight="bold" fill="#f8fafc" text-anchor="middle" letter-spacing="-0.5">${line}</text>`
        )
        .join("\n")}

      <!-- Separator Line -->
      <line x1="220" y1="${titleStartY + titleLines.length * titleLineHeight + 10}" x2="380" y2="${titleStartY + titleLines.length * titleLineHeight + 10}" stroke="${accentColor}" stroke-width="2" opacity="0.75"/>

      <!-- Author -->
      <text x="300" y="${titleStartY + titleLines.length * titleLineHeight + 50}" font-family="sans-serif" font-size="20" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="1">
        by ${safeAuthor}
      </text>

      <!-- Reader's HUB Seal at Bottom -->
      <g transform="translate(300, 785)">
        <circle cx="0" cy="0" r="28" fill="#0b0d13" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.8"/>
        <text x="0" y="-3" font-family="serif" font-size="8.5" font-weight="bold" fill="${accentColor}" text-anchor="middle" letter-spacing="1">
          READER&#39;S
        </text>
        <text x="0" y="10" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
          HUB
        </text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(outputPath);
}

// -------------------------------------------------------------
// MAIN INGESTION FUNCTION
// -------------------------------------------------------------
export async function importAllBooks() {
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`❌ PDF directory not found at ${PDF_DIR}`);
    return;
  }
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }

  console.log("\n=======================================================");
  console.log("  📚 READER'S HUB — INTELLIGENT BOOK INGESTION SYSTEM");
  console.log("=======================================================\n");

  const pdfFiles = fs
    .readdirSync(PDF_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf") && !f.startsWith("."));

  console.log(`🔍 Found ${pdfFiles.length} PDF file(s) in 'public/pdfs/'\n`);

  let existingBooks: BookEntry[] = [];
  if (fs.existsSync(BOOKS_JSON_PATH)) {
    try {
      existingBooks = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, "utf-8"));
    } catch {
      existingBooks = [];
    }
  }

  const finalBooks: BookEntry[] = [];
  const processedHashes = new Set<string>();
  const processedSlugs = new Set<string>();
  const processedTitles = new Set<string>();

  // 1. Preserve existing baseline curated books
  for (const b of existingBooks) {
    if (!b.id || !b.title) continue;
    const slug = slugify(b.id || b.title);
    const titleNorm = b.title.toLowerCase().trim();

    if (!processedSlugs.has(slug) && !processedTitles.has(titleNorm)) {
      processedSlugs.add(slug);
      processedTitles.add(titleNorm);
      if (b.fileHash) processedHashes.add(b.fileHash);
      finalBooks.push(b);
    }
  }

  console.log(`📌 Loaded ${finalBooks.length} baseline books from books.json\n`);
  console.log(`Processing all ${pdfFiles.length} PDF files with intelligent cover pipeline...\n`);

  let extractedCovers = 0;
  let editorialCovers = 0;
  let curatedCovers = 0;
  let skippedDuplicates = 0;
  let failedCount = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const filename = pdfFiles[i];
    const filePath = path.join(PDF_DIR, filename);
    const progress = `[${i + 1}/${pdfFiles.length}]`;

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

      const existingByPdf = finalBooks.find(
        (b) => b.pdf === `/pdfs/${filename}` || b.pdf === `/pdfs/${encodeURIComponent(filename)}`
      );

      // Extract metadata
      const lowerFilename = filename.toLowerCase();
      let title = "";
      let author = "Unknown Author";
      let category = "Classics";
      let language = "English";
      let year = new Date().getFullYear();
      let pageCount = 120;
      let description = "";

      if (KNOWN_METADATA[lowerFilename]) {
        const meta = KNOWN_METADATA[lowerFilename];
        title = meta.title;
        author = meta.author;
        category = meta.category;
        language = meta.language || "English";
        year = meta.year || year;
        description = meta.description || "";
      } else {
        try {
          const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const metaTitle = pdfDoc.getTitle();
          const metaAuthor = pdfDoc.getAuthor();
          const metaSubject = pdfDoc.getSubject() || "";
          pageCount = pdfDoc.getPageCount() || 100;

          const cleaned = cleanTitleAndAuthor(filename);
          title = cleaned.title;
          author = cleaned.author;

          if (metaTitle && metaTitle.trim().length > 3 && !metaTitle.includes("Untitled") && !metaTitle.includes(".pdf")) {
            title = metaTitle.trim();
          }
          if (metaAuthor && metaAuthor.trim().length > 2 && !metaAuthor.includes("Unknown")) {
            author = metaAuthor.trim();
          }

          category = detectCategory(title, author, metaSubject);
          const isHindi = /[\u0900-\u097F]/.test(title) || /[\u0900-\u097F]/.test(metaSubject) || category === "Hindi Literature";
          language = isHindi ? "Hindi" : "English";

          if (metaSubject && metaSubject.length > 20) {
            description = metaSubject.trim();
          }
        } catch {
          const cleaned = cleanTitleAndAuthor(filename);
          title = cleaned.title;
          author = cleaned.author;
          category = detectCategory(title, author, "");
        }
      }

      if (!description) {
        description = `An essential digital edition of ${title} by ${author}. Read complete pages directly in Reader's HUB with distraction-free layout.`;
      }

      const titleNorm = title.toLowerCase().trim();
      let slug = slugify(title);
      if (!slug) slug = `book-${Date.now()}`;

      // Check if already matched an existing book with curated cover
      if (existingByPdf) {
        if (!existingByPdf.fileHash) existingByPdf.fileHash = fileHash;
        if (KNOWN_METADATA[lowerFilename]) {
          const meta = KNOWN_METADATA[lowerFilename];
          if (existingByPdf.author === "Unknown Author" || existingByPdf.title.includes("Microsoft Word") || existingByPdf.title.includes("Output")) {
            existingByPdf.title = meta.title;
            existingByPdf.author = meta.author;
            existingByPdf.category = meta.category;
            if (meta.description) existingByPdf.description = meta.description;
          }
        }

        // Check if existing book has a real cover or needs upgrade
        const existingCoverPath = path.join(process.cwd(), "public", existingByPdf.cover.replace(/^\//, ""));
        const isCuratedJpg = existingByPdf.cover.endsWith(".jpeg") || existingByPdf.cover.endsWith(".jpg") || existingByPdf.cover.endsWith(".png");

        if (fs.existsSync(existingCoverPath) && isCuratedJpg) {
          curatedCovers++;
          console.log(`${progress} 🖼️ Preserved curated real cover: "${existingByPdf.title}" (${existingByPdf.cover})`);
        } else {
          // Try Priority 2: Extract real cover from PDF
          const coverFilename = `${slug}.webp`;
          const coverPath = path.join(THUMBNAIL_DIR, coverFilename);
          const extracted = await tryExtractPdfCover(filePath, coverPath);

          if (extracted) {
            extractedCovers++;
            existingByPdf.cover = `/images/books/${coverFilename}`;
            console.log(`${progress} 📸 Extracted real cover from PDF: "${existingByPdf.title}"`);
          } else {
            // Priority 3: Generate distinct editorial cover
            await generateDistinctEditorialCover(existingByPdf.title, existingByPdf.author, existingByPdf.category, coverPath);
            editorialCovers++;
            existingByPdf.cover = `/images/books/${coverFilename}`;
            console.log(`${progress} 🎨 Generated unique editorial cover: "${existingByPdf.title}"`);
          }
        }

        processedHashes.add(fileHash);
        continue;
      }

      // Check duplicate by file hash or title
      if (processedHashes.has(fileHash) || processedSlugs.has(slug) || processedTitles.has(titleNorm)) {
        skippedDuplicates++;
        console.log(`${progress} ⏭️ Skipped duplicate: "${title}" (${filename})`);
        continue;
      }

      // Process new book cover
      const coverFilename = `${slug}.webp`;
      const coverPath = path.join(THUMBNAIL_DIR, coverFilename);
      const extracted = await tryExtractPdfCover(filePath, coverPath);

      if (extracted) {
        extractedCovers++;
        console.log(`${progress} 📸 Extracted real cover from PDF: "${title}"`);
      } else {
        await generateDistinctEditorialCover(title, author, category, coverPath);
        editorialCovers++;
        console.log(`${progress} 🎨 Generated unique editorial cover: "${title}"`);
      }

      const newBook: BookEntry = {
        id: slug,
        title,
        author,
        category,
        cover: `/images/books/${coverFilename}`,
        pdf: `/pdfs/${filename}`,
        description,
        year,
        pages: pageCount,
        language,
        rating: 4.8,
        featured: false,
        tags: [category, language, "Digital Edition"],
        excerpt: description.slice(0, 110) + "...",
        fileHash,
      };

      finalBooks.push(newBook);
      processedHashes.add(fileHash);
      processedSlugs.add(slug);
      processedTitles.add(titleNorm);
      console.log(`${progress} ✨ Added "${title}" by ${author} [${category}]`);
    } catch (err: any) {
      failedCount++;
      console.error(`${progress} ❌ Error processing ${filename}:`, err?.message || err);
    }
  }

  // Save updated books.json
  fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(finalBooks, null, 2), "utf-8");

  console.log("\n=======================================================");
  console.log("  📊 READER'S HUB COVER PIPELINE REPORT");
  console.log("=======================================================");
  console.log(`  • Total PDFs scanned:             ${pdfFiles.length}`);
  console.log(`  • Curated real covers kept:       ${curatedCovers}`);
  console.log(`  • Real covers extracted from PDF: ${extractedCovers}`);
  console.log(`  • Unique editorial covers made:   ${editorialCovers}`);
  console.log(`  • Duplicates skipped:             ${skippedDuplicates}`);
  console.log(`  • Failed files:                   ${failedCount}`);
  console.log(`  • TOTAL ACTIVE BOOKS IN LIBRARY:  ${finalBooks.length}`);
  console.log("=======================================================\n");
}

if (require.main === module || process.argv[1]?.includes("import-books")) {
  importAllBooks().catch((err) => {
    console.error("Fatal importer error:", err);
    process.exit(1);
  });
}
