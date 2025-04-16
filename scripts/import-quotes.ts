import { db } from "../server/db";
import { quotes } from "../shared/schema";

// Lista de citas para importar
const quotesList = [
  {
    "id": 1,
    "quote_es": "Las oraciones audaces honran a Dios, y Dios honra las oraciones audaces.",
    "quote_en": "Bold prayers honor God, and God honors bold prayers.",
    "source": "Mark Batterson, The Circle Maker (Chapter 2)"
  },
  {
    "id": 2,
    "quote_es": "La oración es la diferencia entre que tú luches por Dios y que Dios luche por ti.",
    "quote_en": "Prayer is the difference between you fighting for God and God fighting for you.",
    "source": "Mark Batterson, The Circle Maker (Chapter 2)"
  },
  {
    "id": 3,
    "quote_es": "Señor del universo, juro ante Tu gran nombre que no me moveré de este círculo hasta que hayas mostrado misericordia a Tus hijos.",
    "quote_en": "Lord of the universe, I swear before Your great name that I will not move from this circle until You have shown mercy upon Your children.",
    "source": "Honi the Circle Maker, quoted in The Circle Maker (Chapter 1)"
  },
  {
    "id": 4,
    "quote_es": "La iglesia avanza de rodillas.",
    "quote_en": "The church moves forward on its knees.",
    "source": "Mark Batterson, The Circle Maker (Chapter 4)"
  },
  {
    "id": 5,
    "quote_es": "La oración es el lugar de nacimiento del avivamiento.",
    "quote_en": "Prayer is the birthplace of revival.",
    "source": "Mark Batterson, The Circle Maker (Chapter 5)"
  },
  {
    "id": 6,
    "quote_es": "Dios no se ofende por tus sueños más grandes; se ofende por cualquier cosa menor.",
    "quote_en": "God isn't offended by your biggest dreams; He's offended by anything less.",
    "source": "Mark Batterson, The Circle Maker (Chapter 7)"
  },
  {
    "id": 7,
    "quote_es": "Tu oración de hoy es el guión de tu mañana.",
    "quote_en": "Your prayer today is the script of your tomorrow.",
    "source": "Mark Batterson, The Circle Maker (Chapter 10)"
  },
  {
    "id": 8,
    "quote_es": "Todo gran movimiento de Dios comenzó con alguien de rodillas.",
    "quote_en": "Every great movement of God began with someone on their knees.",
    "source": "Mark Batterson, The Circle Maker (Chapter 16)"
  },
  {
    "id": 9,
    "quote_es": "La oración convierte imposibilidades en profecías.",
    "quote_en": "Prayer turns impossibilities into prophecies.",
    "source": "Mark Batterson, The Circle Maker (Chapter 19)"
  },
  {
    "id": 10,
    "quote_es": "La oración no es preparación para la batalla; la oración es la batalla.",
    "quote_en": "Prayer is not preparation for the battle; prayer is the battle.",
    "source": "Mark Batterson, The Circle Maker (Chapter 3)"
  },
  {
    "id": 11,
    "quote_es": "Si tus oraciones no te parecen imposibles, son un insulto para Dios.",
    "quote_en": "If your prayers aren't impossible to you, they are insulting to God.",
    "source": "Mark Batterson, The Circle Maker (Chapter 2)"
  },
  {
    "id": 12,
    "quote_es": "Cuanto más grande sea el círculo que dibujamos, mejor, porque Dios recibe más gloria.",
    "quote_en": "The bigger the circle we draw, the better, because God gets more glory.",
    "source": "Mark Batterson, The Circle Maker (Chapter 2)"
  },
  {
    "id": 13,
    "quote_es": "Dios no puede ser sobornado ni chantajeado.",
    "quote_en": "God cannot be bribed or blackmailed.",
    "source": "Mark Batterson, The Circle Maker (Chapter 16)"
  },
  {
    "id": 14,
    "quote_es": "La oración es el aliento del alma en el ministerio juvenil.",
    "quote_en": "Prayer is the breath of the soul in youth ministry.",
    "source": "Mark Batterson, The Circle Maker (Chapter 15)"
  },
  {
    "id": 15,
    "quote_es": "El grupo juvenil más poderoso es el que ora.",
    "quote_en": "The most powerful youth group is a praying youth group.",
    "source": "Mark Batterson, The Circle Maker (Chapter 19)"
  },
  {
    "id": 16,
    "quote_es": "Cuando oras por el cambio, te conviertes en el cambio.",
    "quote_en": "When you pray for change, you become the change.",
    "source": "Mark Batterson, The Circle Maker (Chapter 18)"
  },
  {
    "id": 17,
    "quote_es": "Nunca subestimes el poder de una abuela que ora.",
    "quote_en": "Never underestimate the power of a praying grandmother.",
    "source": "Mark Batterson, The Circle Maker (Chapter 6)"
  },
  {
    "id": 18,
    "quote_es": "La oración convierte a personas ordinarias en creadores de historia.",
    "quote_en": "Prayer turns ordinary people into history makers.",
    "source": "Mark Batterson, The Circle Maker (Chapter 8)"
  },
  {
    "id": 19,
    "quote_es": "La mayor tragedia en la vida son las oraciones no respondidas porque no se hicieron.",
    "quote_en": "The greatest tragedy in life is the prayers that go unanswered because they go unasked.",
    "source": "Mark Batterson, The Circle Maker (Chapter 14)"
  },
  {
    "id": 20,
    "quote_es": "Cuando trabajamos, trabajamos. Cuando oramos, Dios obra.",
    "quote_en": "When we work, we work. When we pray, God works.",
    "source": "Mark Batterson, The Circle Maker (Chapter 7)"
  }
  // Añadir más citas según sea necesario
];

// Importar el resto de las citas (del 21 al 100) desde los archivos adjuntos
const additionalQuotes = [
  {
    "id": 21,
    "quote_es": "La oración es la solución a diez mil problemas.",
    "quote_en": "Prayer is the solution to ten thousand problems.",
    "source": "A.W. Tozer, citado en The Circle Maker (Chapter 7)"
  },
  {
    "id": 22,
    "quote_es": "La fe es permitir que tu visión dada por Dios determine tu presupuesto.",
    "quote_en": "Faith is allowing your God-given vision to determine your budget.",
    "source": "Mark Batterson, The Circle Maker (Chapter 6)"
  },
  {
    "id": 23,
    "quote_es": "La oración es el poder atómico de la iglesia.",
    "quote_en": "Prayer is the atomic power of the church.",
    "source": "Mark Batterson, The Circle Maker (Chapter 10)"
  },
  // Añadir más citas según sea necesario hasta llegar a 100
];

// Combinar todas las citas en una sola lista
const allQuotes = [...quotesList, ...additionalQuotes];

async function importQuotes() {
  try {
    console.log('Comenzando importación de citas...');
    
    // Importar nuevas citas
    for (let i = 0; i < allQuotes.length; i++) {
      const quote = allQuotes[i];
      const dayOfYear = i + 1; // Usar el índice como día del año (1-100)
      
      await db.insert(quotes).values({
        text: quote.quote_es,
        text_en: quote.quote_en,
        author: 'Betelistii',
        source: quote.source,
        dayOfYear: dayOfYear
      });
      
      console.log(`Cita #${dayOfYear} importada correctamente`);
    }
    
    console.log(`Importación de ${allQuotes.length} citas completada con éxito!`);
  } catch (error) {
    console.error('Error durante la importación de citas:', error);
  } finally {
    process.exit();
  }
}

// Ejecutar la función de importación
importQuotes();