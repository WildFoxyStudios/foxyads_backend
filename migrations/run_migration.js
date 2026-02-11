require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUserNameColumn() {
    console.log('🔄 Adding user_name column to users table...');

    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
      -- Add user_name column to users table if it doesn't exist
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
      
      -- Create index for faster searches
      CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users(user_name);
    `
    });

    if (error) {
        console.error('❌ Error adding column:', error);

        // Try direct SQL approach
        console.log('🔄 Trying alternative approach...');
        const sql = `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT ''`;

        const { error: error2 } = await supabase.from('users').select('user_name').limit(1);

        if (error2 && error2.code === '42703') {
            console.log('✅ Column confirmed missing, manual SQL execution required');
            console.log('\nPlease run this SQL in Supabase SQL Editor:');
            console.log('----------------------------------------');
            console.log(sql);
            console.log('----------------------------------------');
            process.exit(1);
        } else if (!error2) {
            console.log('✅ Column user_name already exists!');
        }
    } else {
        console.log('✅ Successfully added user_name column');
    }
}

addUserNameColumn();
