<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use DateTimeImmutable;
use InvalidArgumentException;

/** Календарный день (без времени) в формате Y-m-d. */
final readonly class Day
{
    public function __construct(public string $value)
    {
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if ($parsed === false || $parsed->format('Y-m-d') !== $value) {
            throw new InvalidArgumentException('некорректная дата: ' . $value);
        }
    }

    public static function today(DateTimeImmutable $now): self
    {
        return new self($now->format('Y-m-d'));
    }

    public function plusDays(Interval $interval): self
    {
        return $this->plusDaysCount($interval->days);
    }

    public function plusDaysCount(int $days): self
    {
        $date = (new DateTimeImmutable($this->value))->modify('+' . $days . ' days');

        return new self($date->format('Y-m-d'));
    }

    public function minusDaysCount(int $days): self
    {
        $date = (new DateTimeImmutable($this->value))->modify('-' . $days . ' days');

        return new self($date->format('Y-m-d'));
    }

    public function isOnOrBefore(self $other): bool
    {
        return $this->value <= $other->value;
    }
}
