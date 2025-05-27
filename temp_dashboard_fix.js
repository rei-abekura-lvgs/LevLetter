// 新しいダッシュボードAPI
app.get('/api/dashboard/stats', authenticateRequest, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    // ポイント消化率（500ptを最大として）
    const pointConversionRate = Math.min(100, ((500 - user.weeklyPoints) / 500) * 100);
    
    // 基本データのみ取得
    const sentCards = await storage.getCardsByUser(userId);
    const receivedCards = await storage.getCardsToUser(userId);

    // 個人インタラクション統計
    const sentCardStats = {};
    sentCards.forEach(card => {
      if (card.recipientId && card.recipientId !== userId) {
        sentCardStats[card.recipientId] = (sentCardStats[card.recipientId] || 0) + 1;
      }
    });

    const receivedCardStats = {};
    receivedCards.forEach(card => {
      if (card.senderId && card.senderId !== userId) {
        receivedCardStats[card.senderId] = (receivedCardStats[card.senderId] || 0) + 1;
      }
    });

    // 上位30名のランキング作成
    const createPersonalRanking = async (stats) => {
      const entries = Object.entries(stats)
        .map(([id, count]) => ({ id: parseInt(id), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);

      const rankings = [];
      for (let i = 0; i < entries.length; i++) {
        const user = await storage.getUser(entries[i].id);
        if (user) {
          rankings.push({
            user,
            count: entries[i].count,
            rank: i + 1
          });
        }
      }
      return rankings;
    };

    const personalSentCards = await createPersonalRanking(sentCardStats);
    const personalReceivedCards = await createPersonalRanking(receivedCardStats);

    return res.json({
      monthly: {
        pointConversionRate: Math.round(pointConversionRate),
        reactionRate: 100,
        cardSenders: [],
        likeSenders: [],
        userCardRank: 0,
        userLikeRank: 0
      },
      personal: {
        sentCards: personalSentCards,
        receivedCards: personalReceivedCards,
        sentLikes: [],
        receivedLikes: []
      }
    });
  } catch (error) {
    console.error('ダッシュボード統計情報取得エラー:', error);
    return res.status(500).json({ message: 'ダッシュボード統計情報の取得に失敗しました' });
  }
});