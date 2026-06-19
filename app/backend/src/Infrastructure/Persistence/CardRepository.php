<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use Recall\Domain\Card;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\Day;

/** Доступ к карточкам через Cycle ORM. */
final readonly class CardRepository
{
    public function __construct(private ORMInterface $orm) {}

    /** @return list<Card> */
    public function all(): array
    {
        return $this->collect((new Select($this->orm, Card::class))->orderBy('id')->fetchAll());
    }

    /** @return list<Card> */
    public function dueOn(Day $day): array
    {
        return $this->collect(
            (new Select($this->orm, Card::class))->where('due', '<=', $day->value)->orderBy('id')->fetchAll(),
        );
    }

    public function find(CardId $id): ?Card
    {
        foreach ((new Select($this->orm, Card::class))->where('id', $id->toString())->fetchAll() as $card) {
            if ($card instanceof Card) {
                return $card;
            }
        }

        return null;
    }

    public function count(): int
    {
        return (new Select($this->orm, Card::class))->count();
    }

    public function countDueBetween(Day $from, Day $to): int
    {
        return (new Select($this->orm, Card::class))
            ->where('due', '>=', $from->value)
            ->where('due', '<=', $to->value)
            ->count();
    }

    public function save(Card $card): void
    {
        (new EntityManager($this->orm))->persist($card)->run();
    }

    public function delete(Card $card): void
    {
        (new EntityManager($this->orm))->delete($card)->run();
    }

    /**
     * @param  iterable<mixed> $rows
     * @return list<Card>
     */
    private function collect(iterable $rows): array
    {
        $cards = [];
        foreach ($rows as $row) {
            if ($row instanceof Card) {
                $cards[] = $row;
            }
        }

        return $cards;
    }
}
