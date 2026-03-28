import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  Image,
  ExternalLink,
  Trophy,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getShopItems, saveShopItem, deleteShopItem, getPurchases, savePurchase, getUserById, saveUser, addLog, addNotification } from '@/hooks/useStorage';
import type { UserType, ShopItem, Purchase } from '@/types';

interface ShopPanelProps {
  currentUser: UserType;
}

export default function ShopPanel({ currentUser }: ShopPanelProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showPurchasesList, setShowPurchasesList] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  
  // Form states
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemType, setItemType] = useState<'remove_warning' | 'remove_reprimand' | 'other'>('other');
  const [imageSource, setImageSource] = useState<'url' | 'file'>('url');

  const isOwner = currentUser.lvl === 5;

  useEffect(() => {
    setItems(getShopItems());
    setPurchases(getPurchases());
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myPurchases = purchases.filter(p => p.userId === currentUser.id);
  const pendingPurchases = purchases.filter(p => p.status === 'pending');

  const handleAddItem = () => {
    if (!itemName.trim() || !itemPrice.trim()) return;

    const newItem: ShopItem = {
      id: Date.now().toString(),
      name: itemName,
      description: itemDescription,
      price: parseInt(itemPrice) || 0,
      image: itemImage || undefined,
      type: itemType,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    saveShopItem(newItem);
    setItems(getShopItems());
    setShowAddDialog(false);
    resetForm();
  };

  const handleEditItem = () => {
    if (!editingItem || !itemName.trim() || !itemPrice.trim()) return;

    const updatedItem: ShopItem = {
      ...editingItem,
      name: itemName,
      description: itemDescription,
      price: parseInt(itemPrice) || 0,
      image: itemImage || undefined,
      type: itemType,
    };

    saveShopItem(updatedItem);
    setItems(getShopItems());
    setShowEditDialog(false);
    setEditingItem(null);
    resetForm();
  };

  const handleDeleteItem = (item: ShopItem) => {
    deleteShopItem(item.id);
    setItems(getShopItems());
  };

  const handlePurchase = () => {
    if (!selectedItem) return;

    if (currentUser.balls < selectedItem.price) {
      alert('Недостаточно баллов!');
      return;
    }

    // Deduct balls
    const updatedUser = { ...currentUser, balls: currentUser.balls - selectedItem.price };
    saveUser(updatedUser);

    // Apply item effect
    if (selectedItem.type === 'remove_warning' && updatedUser.warnings > 0) {
      updatedUser.warnings -= 1;
    } else if (selectedItem.type === 'remove_reprimand' && updatedUser.reprimands > 0) {
      updatedUser.reprimands -= 1;
    }
    saveUser(updatedUser);

    // Create purchase record
    const purchase: Purchase = {
      id: Date.now().toString(),
      itemId: selectedItem.id,
      userId: currentUser.id,
      itemName: selectedItem.name,
      price: selectedItem.price,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    savePurchase(purchase);
    setPurchases(getPurchases());

    // Add log
    addLog({
      id: Date.now().toString(),
      type: 'purchase',
      userId: currentUser.id,
      description: `Куплен товар: ${selectedItem.name}`,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    });

    // Notify owner
    addNotification({
      id: Date.now().toString(),
      userId: 1, // Owner ID
      title: 'Новая покупка',
      message: `${currentUser.username} купил ${selectedItem.name}`,
      type: 'purchase',
      read: false,
      created_at: new Date().toISOString(),
    });

    setShowPurchaseDialog(false);
    setSelectedItem(null);
    alert('Покупка успешно совершена!');
  };

  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemImage('');
    setItemType('other');
  };

  const openEditDialog = (item: ShopItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description);
    setItemPrice(item.price.toString());
    setItemImage(item.image || '');
    setItemType(item.type);
    setShowEditDialog(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setItemImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ShopItemCard = ({ item }: { item: ShopItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all"
    >
      {item.image && (
        <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-slate-800">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-white">{item.name}</h3>
        {isOwner && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEditDialog(item)}
              className="h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteItem(item)}
              className="h-8 w-8 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-amber-400">{item.price} баллов</span>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setSelectedItem(item);
            setShowPurchaseDialog(true);
          }}
          disabled={currentUser.balls < item.price}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Купить
        </Button>
      </div>

      {item.type === 'remove_warning' && (
        <Badge className="absolute top-2 left-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Снятие предупреждения
        </Badge>
      )}
      {item.type === 'remove_reprimand' && (
        <Badge className="absolute top-2 left-2 bg-red-500/20 text-red-400 border-red-500/30">
          <Ban className="w-3 h-3 mr-1" />
          Снятие выговора
        </Badge>
      )}
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">Магазин</h1>
          <p className="text-slate-400">Ваш баланс: <span className="text-amber-400 font-semibold">{currentUser.balls} баллов</span></p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPurchasesList(true)}
                className="border-white/10"
              >
                Покупки ({pendingPurchases.length})
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-violet-600 hover:bg-violet-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить товар
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-violet-600">
              Все товары ({filteredItems.length})
            </TabsTrigger>
            <TabsTrigger value="my" className="flex-1 data-[state=active]:bg-violet-600">
              Мои покупки ({myPurchases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <ShopItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my">
            <div className="space-y-2">
              {myPurchases.map(purchase => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{purchase.itemName}</h3>
                      <p className="text-sm text-slate-400">
                        {new Date(purchase.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400">{purchase.price}</span>
                      <Badge className={purchase.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {purchase.status === 'completed' ? 'Завершено' : 'В обработке'}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить товар</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Название товара..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="Описание..."
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              type="number"
              placeholder="Цена в баллах..."
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            
            <div className="flex gap-2">
              <Button
                variant={imageSource === 'url' ? 'default' : 'outline'}
                onClick={() => setImageSource('url')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                URL
              </Button>
              <Button
                variant={imageSource === 'file' ? 'default' : 'outline'}
                onClick={() => setImageSource('file')}
                className="flex-1"
              >
                <Image className="w-4 h-4 mr-2" />
                Файл
              </Button>
            </div>

            {imageSource === 'url' ? (
              <Input
                placeholder="URL изображения..."
                value={itemImage}
                onChange={(e) => setItemImage(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-white/5 border-white/10 text-white"
              />
            )}

            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as 'remove_warning' | 'remove_reprimand' | 'other')}
              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="other">Обычный товар</option>
              <option value="remove_warning">Снятие предупреждения</option>
              <option value="remove_reprimand">Снятие выговора</option>
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!itemName.trim() || !itemPrice.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать товар</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Название товара..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="Описание..."
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              type="number"
              placeholder="Цена в баллах..."
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="URL изображения..."
              value={itemImage}
              onChange={(e) => setItemImage(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as 'remove_warning' | 'remove_reprimand' | 'other')}
              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="other">Обычный товар</option>
              <option value="remove_warning">Снятие предупреждения</option>
              <option value="remove_reprimand">Снятие выговора</option>
            </select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleEditItem}
                disabled={!itemName.trim() || !itemPrice.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Подтверждение покупки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedItem?.image && (
              <div className="aspect-video rounded-xl overflow-hidden">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white text-lg">{selectedItem?.name}</h3>
              <p className="text-slate-400">{selectedItem?.description}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Ваш баланс:</span>
                <span className="text-amber-400 font-semibold">{currentUser.balls} баллов</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Цена:</span>
                <span className="text-amber-400 font-semibold">{selectedItem?.price} баллов</span>
              </div>
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between items-center">
                <span className="text-white">Останется:</span>
                <span className="text-emerald-400 font-semibold">
                  {currentUser.balls - (selectedItem?.price || 0)} баллов
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPurchaseDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={currentUser.balls < (selectedItem?.price || 0)}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Подтвердить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchases List Dialog (Owner only) */}
      <Dialog open={showPurchasesList} onOpenChange={setShowPurchasesList}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Все покупки</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 my-4">
            <div className="space-y-2">
              {purchases.map(purchase => {
                const buyer = getUserById(purchase.userId);
                return (
                  <div key={purchase.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={buyer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${buyer?.username}`}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-white">{buyer?.username}</p>
                          <p className="text-sm text-slate-400">{purchase.itemName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-semibold">{purchase.price} баллов</p>
                        <p className="text-xs text-slate-400">
                          {new Date(purchase.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
