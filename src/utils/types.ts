export type IfExtends<U, T, A, B> = U extends T ? A : B;
export type ConditionalKeys<S, C> = {
  [K in keyof S]: IfExtends<S[K], C, K, never>;
}[keyof S];
export type FilterValue<S, C> = Pick<S, ConditionalKeys<S, C>>;
export type ExcludeValue<S, C> = Omit<S, ConditionalKeys<S, C>>;

export type OptionalKeys<S> = ConditionalKeys<S, undefined>;
export type RequiredKeys<S> = Exclude<keyof S, OptionalKeys<S>>;

export type OptionalType<S> = {
  [K in OptionalKeys<S>]?: S[K];
} & {
  [K in RequiredKeys<S>]: S[K];
};
