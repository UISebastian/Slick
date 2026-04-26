import type { CurrentUser } from "../../../auth/current-user";
import { requireRole } from "../../workflows/authorization";
import { reviewRepository, type ReviewRepository } from "../repository";
import type { ListReviewsQuery } from "../schemas";

export type ListReviewsCommand = {
  input: ListReviewsQuery;
  user: CurrentUser;
};

export async function listReviews(
  command: ListReviewsCommand,
  repository: ReviewRepository = reviewRepository
) {
  requireRole(command.user, "viewer");

  const reviews = await repository.list({
    agencyId: command.user.agencyId,
    status: command.input.status,
    limit: command.input.limit
  });

  return {
    reviews,
    count: reviews.length
  };
}
