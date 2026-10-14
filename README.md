# library-catalog-service

This project models a simple library catalog in MongoDB with a `Genre` collection and a `Book` collection. The design keeps book metadata clean while allowing genres to be reused across many titles.

## Schema Design

### Genre

- `name`: This is a display field for the human-readable genre label, such as "Science Fiction". It is stored as a plain string because it is a core attribute of the genre itself and not a separate object that would benefit from embedding into every book.
- `slug`: This is a URL-friendly, lowercase version of the genre name, such as "science-fiction". It is a plain string with a unique constraint so the data is easy to query, stable for routes, and prevents duplicate genre names from being created with different capitalization.

The `Genre` collection is intentionally separate from `Book` because many books will share the same genre. Keeping a genre as its own document avoids repeating the same title across every book record while still making it easy to populate a books-to-genre relationship.

### Book

- `title`: Stored as a plain string because each book has a single title and this field is queried frequently for catalog searches and display pages.
- `author`: Stored as a plain string because the author is a direct property of the book and is easier to display and filter than a nested object for this project.
- `isbn`: Stored as a plain string and marked unique. This is a canonical identifier for a book, so it should stay as a simple field rather than as an embedded object. It also gives a fast way to prevent duplicate catalog entries.
- `description`: Stored as a plain string because it is a book-specific narrative field and does not need to be shared with any other collection.
- `coverImage`: Stored as a string URL because it is a single asset reference tied directly to the book. Embedding it in the book document keeps the presentation data close to the record that uses it.
- `totalCopies`: Stored as a number because it is an inventory statistic for a single book record. It belongs with the book and would be awkward to normalize into another collection.
- `availableCopies`: Stored as a number because it reflects the current inventory state of this same title. It is kept in the book doc so the library can immediately answer: "how many copies are currently available?" without chasing a second collection.
- `genre`: Stored as a MongoDB `ObjectId` reference to `Genre` with `ref: 'Genre'`. This is the key relational decision in the schema. A book can reference a single reusable genre such as "Fantasy", while the genre itself is kept in its own collection. This avoids duplicating the same genre name across every book and keeps the data normalized.

### Trade-off considerations

The main trade-off here is normalization versus duplication. Embedding `title`, `author`, `description`, and `coverImage` keeps reads simple because the book record contains all the information it needs in one place. For the `genre` field, a reference is better than embedding because a genre like "Science Fiction" is reused across many books; duplicating that string on every book would create repeated data and make updates harder to manage. The reference introduces one extra lookup when fetching a book with its genre, but it preserves consistency and reduces duplication, which is the better fit for this catalog.

## Getting Started

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database:
   ```bash
   npm run seed
   ```

The seed script clears existing `Book` and `Genre` documents, inserts at least four genres, and adds fifteen realistic book records that reference those genres.
