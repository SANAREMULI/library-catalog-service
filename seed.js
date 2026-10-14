require('dotenv').config();

const mongoose = require('mongoose');
const Genre = require('./models/Genre');
const Book = require('./models/Book');

const genreSeeds = [
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Romance', slug: 'romance' },
  { name: 'History', slug: 'history' },
];

const bookSeeds = [
  {
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '9780441172719',
    description: 'A desert planet and an epic struggle for power reshape the galaxy.',
    coverImage: 'https://images.example.com/dune.jpg',
    totalCopies: 8,
    availableCopies: 5,
    genre: 'science-fiction',
  },
  {
    title: 'Foundation',
    author: 'Isaac Asimov',
    isbn: '9780553293357',
    description: 'A mathematician predicts the collapse of civilization and the future of humankind.',
    coverImage: 'https://images.example.com/foundation.jpg',
    totalCopies: 6,
    availableCopies: 4,
    genre: 'science-fiction',
  },
  {
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    isbn: '9780441478125',
    description: 'On a remote world, diplomacy and identity are tested through a remarkable alliance.',
    coverImage: 'https://images.example.com/left-hand.jpg',
    totalCopies: 5,
    availableCopies: 3,
    genre: 'science-fiction',
  },
  {
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    isbn: '9780756404741',
    description: 'A gifted young musician narrates the years that shaped his legend.',
    coverImage: 'https://images.example.com/name-of-wind.jpg',
    totalCopies: 7,
    availableCopies: 6,
    genre: 'fantasy',
  },
  {
    title: 'Mistborn: The Final Empire',
    author: 'Brandon Sanderson',
    isbn: '9780765311786',
    description: 'A rebellion rises beneath the iron rule of a tyrannical empire.',
    coverImage: 'https://images.example.com/mistborn.jpg',
    totalCopies: 9,
    availableCopies: 7,
    genre: 'fantasy',
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '9780261102217',
    description: 'A reluctant hero joins a company of dwarves in an adventure full of danger and wonder.',
    coverImage: 'https://images.example.com/hobbit.jpg',
    totalCopies: 10,
    availableCopies: 8,
    genre: 'fantasy',
  },
  {
    title: 'The Girl with the Dragon Tattoo',
    author: 'Stieg Larsson',
    isbn: '9780307454546',
    description: 'A journalist and a brilliant hacker uncover a decades-old conspiracy.',
    coverImage: 'https://images.example.com/dragon-tattoo.jpg',
    totalCopies: 8,
    availableCopies: 5,
    genre: 'mystery',
  },
  {
    title: 'And Then There Were None',
    author: 'Agatha Christie',
    isbn: '9780062073488',
    description: 'A deadly island game turns into a tense and classic whodunit.',
    coverImage: 'https://images.example.com/ten-nobody.jpg',
    totalCopies: 6,
    availableCopies: 4,
    genre: 'mystery',
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    isbn: '9781250301703',
    description: 'A psychotherapist becomes obsessed with a patient who refuses to speak.',
    coverImage: 'https://images.example.com/silent-patient.jpg',
    totalCopies: 7,
    availableCopies: 3,
    genre: 'mystery',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '9781503290563',
    description: 'In a world of manners and expectations, romance and wit take center stage.',
    coverImage: 'https://images.example.com/pride-prejudice.jpg',
    totalCopies: 9,
    availableCopies: 6,
    genre: 'romance',
  },
  {
    title: 'Persuasion',
    author: 'Jane Austen',
    isbn: '9780141439681',
    description: 'A second chance at love unfolds against a beautifully observed Regency backdrop.',
    coverImage: 'https://images.example.com/persuasion.jpg',
    totalCopies: 5,
    availableCopies: 3,
    genre: 'romance',
  },
  {
    title: 'The Notebook',
    author: 'Nicholas Sparks',
    isbn: '9780446547577',
    description: 'A love story spanning decades reveals how memory, devotion, and time shape connection.',
    coverImage: 'https://images.example.com/notebook.jpg',
    totalCopies: 6,
    availableCopies: 4,
    genre: 'romance',
  },
  {
    title: 'The Story of the World',
    author: 'Susan Wise Bauer',
    isbn: '9781933339000',
    description: 'A compelling introduction to the milestones and movements of world history.',
    coverImage: 'https://images.example.com/story-world.jpg',
    totalCopies: 7,
    availableCopies: 5,
    genre: 'history',
  },
  {
    title: 'The Guns of August',
    author: 'Barbara W. Tuchman',
    isbn: '9780345386236',
    description: 'An award-winning account of the opening month of World War I.',
    coverImage: 'https://images.example.com/guns-august.jpg',
    totalCopies: 5,
    availableCopies: 2,
    genre: 'history',
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    isbn: '9780062316097',
    description: 'A sweeping narrative on how humans transformed the planet and built civilizations.',
    coverImage: 'https://images.example.com/sapiens.jpg',
    totalCopies: 8,
    availableCopies: 6,
    genre: 'history',
  },
];

async function seedDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined. Please add it to your .env file.');
  }

  await mongoose.connect(MONGODB_URI);

  await Genre.deleteMany({});
  await Book.deleteMany({});

  const insertedGenres = await Genre.insertMany(genreSeeds);
  const genreDictionary = Object.fromEntries(
    insertedGenres.map((genre) => [genre.slug, genre._id])
  );

  const booksToInsert = bookSeeds.map((book) => ({
    ...book,
    genre: genreDictionary[book.genre],
  }));

  await Book.insertMany(booksToInsert);

  console.log(`Seeded ${insertedGenres.length} genres and ${booksToInsert.length} books`);

  await mongoose.disconnect();
}

seedDatabase().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
