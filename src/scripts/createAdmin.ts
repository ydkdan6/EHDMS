import 'dotenv/config'; 
import { backendSupabase } from '@/lib/backendSupa';

async function createAdminUser() {
    try {
        const { data: authData, error: signUpError } = await backendSupabase.auth.signUp({
            email: 'admin@healthcare.com',
            password: 'admin123',
            options: { data: { first_name: 'System', last_name: 'Admin', role: 'admin' } }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
            const { error: profileError } = await backendSupabase
                .from('users')
                .insert([{ id: authData.user.id, email: 'admin@healthcare.com', first_name: 'System', last_name: 'Admin', role: 'admin', phone_number: '000-000-0000' }]);

            if (profileError) throw profileError;

            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

createAdminUser();
