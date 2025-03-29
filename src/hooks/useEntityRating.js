// useEntityRating.js
import { useInfluencerRatingData } from './useInfluencerRatingData';
import { useUserRatingData } from './useUserRatingData';

export default function useEntityRating(entity) {
  const isStreamer = entity?.type === 'streamer';
  const isUser = entity?.type === 'user';

  const influencerRatingHook = useInfluencerRatingData(isStreamer ? entity.id : null);
  const userRatingHook = useUserRatingData(isUser ? entity.id : null);

  const ratedEntityData = isStreamer
    ? influencerRatingHook.influencerData
    : isUser
    ? userRatingHook.userData
    : null;
  const entityRating = isStreamer
    ? influencerRatingHook.rating
    : isUser
    ? userRatingHook.rating
    : null;
  const submitRating = isStreamer
    ? influencerRatingHook.submitRating
    : isUser
    ? userRatingHook.submitRating
    : null;
  const ratingLoading = isStreamer
    ? influencerRatingHook.loading
    : isUser
    ? userRatingHook.loading
    : false;
  const ratingError = isStreamer
    ? influencerRatingHook.error
    : isUser
    ? userRatingHook.error
    : null;

  return {
    ratedEntityData,
    entityRating,
    submitRating,
    ratingLoading,
    ratingError,
  };
}