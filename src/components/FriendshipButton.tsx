
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock, ShieldAlert, Loader2, Check } from 'lucide-react';
import { FriendshipStatus, sendFriendRequest, acceptFriendRequest } from '@/lib/profile-service';
import { useToast } from '@/hooks/use-toast';

interface Props {
  targetUserId: string;
  currentUserId: string;
  initialStatus: FriendshipStatus;
  requestedBy: string;
  onStatusChange: () => void;
}

export default function FriendshipButton({ targetUserId, currentUserId, initialStatus, requestedBy, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      if (initialStatus === 'none') {
        await sendFriendRequest(currentUserId, targetUserId);
        toast({ title: "تم إرسال الطلب", description: "بانتظار موافقة الطرف الآخر." });
      } else if (initialStatus === 'pending' && requestedBy !== currentUserId) {
        await acceptFriendRequest(currentUserId, targetUserId);
        toast({ title: "أصبحتم أصدقاء!", description: "تم قبول طلب الصداقة بنجاح." });
      }
      onStatusChange();
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشلت العملية، حاول لاحقاً." });
    } finally {
      setLoading(false);
    }
  };

  if (initialStatus === 'self') return null;

  if (initialStatus === 'accepted') {
    return (
      <Button variant="outline" className="rounded-xl font-bold gap-2 text-green-600 border-green-500/20 bg-green-50">
        <UserCheck size={18} />
        أصدقاء
      </Button>
    );
  }

  if (initialStatus === 'pending') {
    if (requestedBy === currentUserId) {
      return (
        <Button variant="secondary" disabled className="rounded-xl font-bold gap-2 opacity-70">
          <Clock size={18} />
          الطلب معلق
        </Button>
      );
    } else {
      return (
        <Button onClick={handleAction} disabled={loading} className="rounded-xl font-black gap-2 bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> قبول الصداقة</>}
        </Button>
      );
    }
  }

  return (
    <Button onClick={handleAction} disabled={loading} className="rounded-xl font-black gap-2">
      {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> إضافة صديق</>}
    </Button>
  );
}
