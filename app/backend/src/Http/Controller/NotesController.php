<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Note;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\Tag;
use Recall\Http\Input\NoteInput;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\NoteRepository;

final readonly class NotesController
{
    public function __construct(
        private NoteRepository $notes,
        private Serializer $serializer,
        private DateTimeImmutable $now,
    ) {}

    public function index(Request $request, Response $response): Response
    {
        $tagParam = $request->getQueryParams()['tag'] ?? null;
        $tag = is_string($tagParam) && $tagParam !== '' ? Tag::fromString($tagParam) : null;

        $qParam = $request->getQueryParams()['q'] ?? null;
        $titleQuery = is_string($qParam) ? $qParam : null;

        return Json::write($response, array_map($this->serializer->serialize(...), $this->notes->all($tag, $titleQuery)));
    }

    /** @param array<array-key, mixed> $args */
    public function show(Request $request, Response $response, array $args): Response
    {
        $note = $this->lookup($args);

        return $note === null
            ? Json::error($response, 'note not found', 404)
            : Json::write($response, $this->serializer->serialize($note));
    }

    public function create(Request $request, Response $response): Response
    {
        $input = NoteInput::fromArray($this->body($request));
        $note = Note::create($input->title, $input->body, $input->tags, $input->links, $this->now);
        $this->notes->save($note);

        return Json::write($response, $this->serializer->serialize($note), 201);
    }

    /** @param array<array-key, mixed> $args */
    public function update(Request $request, Response $response, array $args): Response
    {
        $note = $this->lookup($args);
        if ($note === null) {
            return Json::error($response, 'note not found', 404);
        }

        $input = NoteInput::fromArray($this->body($request));
        $note->revise($input->title, $input->body, $input->tags, $input->links, $this->now);
        $this->notes->save($note);

        return Json::write($response, $this->serializer->serialize($note));
    }

    /** @param array<array-key, mixed> $args */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $note = $this->lookup($args);
        if ($note === null) {
            return Json::error($response, 'note not found', 404);
        }

        $this->notes->delete($note);

        return $response->withStatus(204);
    }

    /** @param array<array-key, mixed> $args */
    private function lookup(array $args): ?Note
    {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return null;
        }
        try {
            return $this->notes->find(NoteId::fromString($raw));
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    /** @return array<array-key, mixed> */
    private function body(Request $request): array
    {
        $body = $request->getParsedBody();

        return is_array($body) ? $body : [];
    }
}
