<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use Recall\Domain\Review;
use Recall\Domain\ValueObject\Day;

/** Доступ к повторениям через Cycle ORM. */
final readonly class ReviewRepository
{
    public function __construct(private ORMInterface $orm) {}

    public function save(Review $review): void
    {
        (new EntityManager($this->orm))->persist($review)->run();
    }

    /** Серия подряд идущих календарных дней с хотя бы одним повторением. */
    public function streakEndingOn(Day $today): int
    {
        $days = [];
        foreach ((new Select($this->orm, Review::class))->fetchAll() as $review) {
            if ($review instanceof Review) {
                $days[Day::today($review->createdAt())->value] = true;
            }
        }

        if ($days === []) {
            return 0;
        }

        $cursor = isset($days[$today->value]) ? $today : $today->minusDaysCount(1);
        $streak = 0;
        while (isset($days[$cursor->value])) {
            ++$streak;
            $cursor = $cursor->minusDaysCount(1);
        }

        return $streak;
    }
}
