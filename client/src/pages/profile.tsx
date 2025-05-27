import { useState } from "react";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, HeartIcon, Edit2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileForm from "@/components/profile-form";
import PasswordChangeForm from "@/components/password-change-form";

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
            <div className="flex-shrink-0 relative">
              {user.customAvatarUrl ? (
                <img 
                  src={user.customAvatarUrl} 
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className={`h-24 w-24 rounded-full bg-${user.avatarColor} flex items-center justify-center text-white text-xl font-semibold`}>
                  {userInitials}
                </div>
              )}
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                onClick={() => setShowProfileModal(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">{user.displayName || user.name}</h2>
              {user.department && (
                <p className="text-gray-600 mb-4">{user.department}</p>
              )}
              <p className="text-gray-600 mb-6">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      

      
      {/* セキュリティセクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            セキュリティ設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-800">パスワード</h4>
              <p className="text-sm text-gray-600">アカウントのセキュリティを保つため、定期的にパスワードを変更してください</p>
            </div>
            <Button 
              onClick={() => setShowPasswordModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              パスワード変更
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* プロフィール編集モーダル */}
      <ProfileForm
        user={user}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
      
      {/* パスワード変更モーダル */}
      <PasswordChangeForm
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />
      
      {/* フッター */}
      <footer className="mt-12 py-8 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐻</span>
            </div>
            <span className="text-xl font-bold text-gray-800">LevLetter</span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            社内コミュニケーションを活性化する感謝カードプラットフォーム
          </p>
          <p className="text-gray-500 text-xs">
            © 2025 LevLetter. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
