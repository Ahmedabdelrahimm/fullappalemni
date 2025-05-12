const db = require('../db.js');

const categories = [
    { name: 'National Schools' },
    { name: 'International Schools' },
    { name: 'Universities' },
    { name: 'Communities' },
    { name: 'Blogs' }
];

async function insertCategories() {
    const client = await db.connect();
    try {
        // First, check if categories already exist
        const existingCategories = await client.query('SELECT category_name FROM institution_categories');
        const existingNames = existingCategories.rows.map(c => c.category_name);

        // Insert only categories that don't exist
        for (const category of categories) {
            if (!existingNames.includes(category.name)) {
                await client.query(
                    'INSERT INTO institution_categories (category_name) VALUES ($1)',
                    [category.name]
                );
                console.log(`Inserted category: ${category.name}`);
            } else {
                console.log(`Category already exists: ${category.name}`);
            }
        }

        console.log('Categories insertion completed');
    } catch (err) {
        console.error('Error inserting categories:', err);
    } finally {
        client.release();
    }
}

// Run the insertion
insertCategories().then(() => {
    console.log('Script completed');
    process.exit(0);
}).catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
}); 