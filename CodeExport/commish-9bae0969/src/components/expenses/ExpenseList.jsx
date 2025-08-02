
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, Calendar, Receipt, MapPin, ChevronUp, ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { toValidDate } from '@/components/utils/dateUtils';

const categoryColors = {
  exchange_gift: "bg-blue-100 text-blue-800 border-blue-200",
  settlement_gift: "bg-green-100 text-green-800 border-green-200",
  office_equipment: "bg-purple-100 text-purple-800 border-purple-200",
  travel: "bg-orange-100 text-orange-800 border-orange-200",
  wages: "bg-red-100 text-red-800 border-red-200",
  training: "bg-yellow-100 text-yellow-800 border-yellow-200",
  coaching: "bg-pink-100 text-pink-800 border-pink-200",
  other: "bg-slate-100 text-slate-800 border-slate-200"
};

const categoryLabels = {
  exchange_gift: "Exchange Gift",
  settlement_gift: "Settlement Gift", 
  office_equipment: "Office Equipment",
  travel: "Travel",
  wages: "Wages",
  training: "Training",
  coaching: "Coaching",
  other: "Other"
};

const SortableHeader = ({ children, sortKey, currentSort, onSort }) => {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;
  
  return (
    <button
      className="flex items-center gap-2 text-left font-medium text-slate-900 hover:text-slate-600 transition-colors focus:outline-none focus:ring-0"
      onClick={() => onSort(sortKey)}
    >
      {children}
      <div className="flex flex-col">
        <ChevronUp 
          className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-slate-900' : 'text-slate-300'}`} 
        />
        <ChevronDown 
          className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-slate-900' : 'text-slate-300'}`} 
        />
      </div>
    </button>
  );
};

export default function ExpenseList({ 
  expenses, 
  onEdit, 
  onDelete, 
  isScrollable = false, 
  selectedExpenses = [], 
  selectAll = false, 
  onSelectAll, 
  onSelectExpense,
  sortConfig = { key: null, direction: 'asc' },
  onSort
}) {
  return (
    <Card className={`card-shadow bg-white border-0 ${isScrollable ? 'h-full flex flex-col' : ''}`}>
      <CardHeader className="flex-shrink-0 border-b border-slate-100">
        <CardTitle>Expenses List</CardTitle>
      </CardHeader>
      <CardContent className={`p-0 ${isScrollable ? 'flex-1 overflow-hidden' : ''}`}>
        <div className={`${isScrollable ? 'h-full overflow-y-auto' : 'overflow-x-auto'}`}>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left p-4 font-medium text-slate-900 w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={onSelectAll}
                  />
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="description" currentSort={sortConfig} onSort={onSort}>
                    Description
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="amount" currentSort={sortConfig} onSort={onSort}>
                    Amount
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="category" currentSort={sortConfig} onSort={onSort}>
                    Category
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="expense_date" currentSort={sortConfig} onSort={onSort}>
                    Date
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="property_address" currentSort={sortConfig} onSort={onSort}>
                    Property Address
                  </SortableHeader>
                </th>
                <th className="text-right p-4 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const expenseDate = toValidDate(expense.expense_date);
                const isSelected = selectedExpenses.includes(expense.id);
                return (
                  <tr key={expense.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectExpense(expense.id, checked)}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{expense.description}</span>
                        </div>
                        {expense.tax_deductible && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            Tax Deductible
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-red-600">
                        -${expense.amount?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${categoryColors[expense.category]} border text-xs`}>
                        {categoryLabels[expense.category]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">
                          {expenseDate ? format(expenseDate, 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {expense.property_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{expense.property_address}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(expense)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(expense.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
