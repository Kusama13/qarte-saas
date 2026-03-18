import { createPhotoHandlers } from '../_photo-helpers';

export const { POST, DELETE } = createPhotoHandlers({
  tableName: 'planning_slot_result_photos',
  storagePrefix: 'results',
  rateLimitKey: 'planning-result-photos',
});
