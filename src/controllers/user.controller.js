import supabase from '../config/db.config.js';
import bcrypt from 'bcryptjs';

// Get all records from the 'user' table
export async function getAllUsers(req, res) {
    try {
        const { data, error } = await supabase
            .from('user')
            .select('*')
            .order('id', { ascending: true });

        // Log the response from Supabase
        console.log('Supabase response:', { data, error });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลในตาราง user' });
        }

        return res.status(200).json({ records: data });
    } catch (error) {
        console.error(`[ERROR]: Failed to fetch user records: ${error.message}`);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
}

// Create a new record in the 'user' table
export async function createUser(req, res) {
    try {
        const { full_name, email, password, role,assigned_departments } = req.body;

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('user')
            .insert({ full_name, email, password: hashedPassword, role,assigned_departments });

        if (error) {
            throw error;
        }

        return res.status(201).json({ message: 'User ถูกสร้างสำเร็จ', newRecord: data });
    } catch (error) {
        console.error(`[ERROR]: Failed to create user record: ${error.message}`);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' });
    }
}

// Update a record in the 'user' table by ID
export async function updateUser(req, res) {
    const { id } = req.params;
    try {
        const { password, ...updateData } = req.body;

        // Hash the password if it is being updated
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const { data, error } = await supabase
            .from('user')
            .update(updateData)
            .eq('id', id);

        if (error) {
            throw error;
        }

        return res.status(200).json({ message: 'User ถูกอัพเดทสำเร็จ', updatedRecord: data });
    } catch (error) {
        console.error(`[ERROR]: Failed to update user record: ${error.message}`);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' });
    }
}

// Delete a record in the 'user' table by ID
export async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('user')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return res.status(200).json({ message: 'User ถูกลบสำเร็จ', deletedRecord: data });
    } catch (error) {
        console.error(`[ERROR]: Failed to delete user record: ${error.message}`);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
}

export default {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
};