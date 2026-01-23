'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GroupDialog } from './group-dialog';
import { getProductGroups, getAllProducts, deleteProductGroup } from './actions';
import { toast } from 'sonner';

export default function AdminProductGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const [groupsData, productsData] = await Promise.all([
      getProductGroups(),
      getAllProducts()
    ]);
    setGroups(groupsData);
    setAllProducts(productsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [dialogOpen]); // Перезагружаем при закрытии диалога

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены? Это может повлиять на работу конструктора.')) return;
    const res = await deleteProductGroup(id);
    if (res.success) {
      toast.success('Группа удалена');
      loadData();
    } else {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Группы конструктора (Сырная тарелка)</h1>
        <Button onClick={() => { setEditingGroup(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Добавить группу
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Процент (%)</TableHead>
              <TableHead>Товаров</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Групп пока нет. Создайте первую (например "Твердые сыры").
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.basePercent}%</TableCell>
                  <TableCell>{group.products.length}</TableCell>
                  <TableCell>
                    {group.useInConstructor ? (
                      <Badge variant="default" className="bg-green-600">Активна</Badge>
                    ) : (
                      <Badge variant="outline">Скрыта</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingGroup(group); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupToEdit={editingGroup}
        allProducts={allProducts}
      />
    </div>
  );
}