<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Stats;
use Recall\Domain\ValueObject\Day;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\CardRepository;
use Recall\Infrastructure\Persistence\ReviewRepository;

final readonly class StatsController
{
    public function __construct(
        private CardRepository $cards,
        private ReviewRepository $reviews,
        private Serializer $serializer,
        private DateTimeImmutable $now,
    ) {}

    public function index(Request $request, Response $response): Response
    {
        $today = Day::today($this->now);
        $weekEnd = $today->plusDaysCount(6);

        $stats = new Stats(
            dueToday: count($this->cards->dueOn($today)),
            dueWeek: count($this->cards->dueOn($weekEnd)),
            streak: $this->reviews->streakEndingOn($today),
        );

        return Json::write($response, $this->serializer->serialize($stats));
    }
}
