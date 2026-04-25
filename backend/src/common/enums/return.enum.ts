export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SHIPPED_BACK = 'shipped_back',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  SIZE_FIT = 'size_fit',
  DAMAGED_IN_SHIPPING = 'damaged_in_shipping',
  OTHER = 'other',
}
