"use client";

import FinanceRecordPanel from "@/components/FinanceRecordPanel";
import {
    createTeacherFinanceRecord,
    deleteTeacherFinanceRecord,
    getTeacherFinanceMonthlyReport,
    getTeacherFinanceRecords,
} from "@/services/financeService";

export default function TeacherFinancePage() {
    return (
        <FinanceRecordPanel
            title="Personal Teaching Finance"
            loadRecords={getTeacherFinanceRecords}
            loadReport={getTeacherFinanceMonthlyReport}
            createRecord={createTeacherFinanceRecord}
            deleteRecord={deleteTeacherFinanceRecord}
        />
    );
}
