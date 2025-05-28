import { CardWithRelations, User } from "@shared/schema";
import CardItem from "@/components/card-item";

interface CardListProps {
  cards: CardWithRelations[];
  user: User;
  readCardIds: Set<number>;
}

export function CardList({ cards, user, readCardIds }: CardListProps) {
  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          currentUser={user}
          isUnread={!readCardIds.has(card.id)}
        />
      ))}
    </div>
  );
}