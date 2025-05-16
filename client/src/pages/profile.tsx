import { useState } from "react";
import { User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, HeartIcon, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileForm from "@/components/profile-form";

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ユーザーのイニシャル
  const userInitials = user.name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">プロフィール</h1>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <div className={`h-24 w-24 rounded-full bg-${user.avatarColor} flex items-center justify-center text-white text-xl font-semibold`}>
                {userInitials}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">{user.displayName || user.name}</h2>
              {user.department && (
                <p className="text-gray-600 mb-4">{user.department}</p>
              )}
              <p className="text-gray-600 mb-6">{user.email}</p>
              
              <Button 
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                プロフィールを編集
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">今週のポイント</h3>
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">{user.weeklyPoints}</span>
                  <span className="text-gray-600 ml-2">/500</span>
                </div>
                <p className="text-sm text-gray-600">残りポイント</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              毎週月曜日に500ポイントが付与されます。ポイントは週の終わりにリセットされます。
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">獲得ポイント</h3>
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-accent-500 mr-3 fill-current" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {user.totalPointsReceived.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">累計獲得ポイント</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              これまでにカードへのいいねで獲得したポイントの合計です。
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* プロフィール編集モーダル */}
      <ProfileForm
        user={user}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </div>
  );
}
