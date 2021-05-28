export type IsMountedFunctionType = () => boolean;
export type UseSafeEffectDestructor = () => void;

export type UseSafeEffectEffect = (
  m: IsMountedFunctionType,
) => void | UseSafeEffectDestructor;
