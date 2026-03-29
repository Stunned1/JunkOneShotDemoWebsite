/* existing code */
import AddRecurringExpenseForm from '@/components/AddRecurringExpenseForm';
/* existing code */

{isMember && (
  <>
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Add Recurring Expense</h2>
      <AddRecurringExpenseForm groupId={id} members={members} currentMemberId={member.id} onAdded={load} />
    </div>
    /* existing code */
  </>
)}
/* existing code */