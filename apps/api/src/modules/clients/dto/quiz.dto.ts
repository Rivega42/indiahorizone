import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Quiz / анкета клиента (#B-04, sub #514).
 *
 * Все поля optional — quiz заполняется поэтапно (PATCH сохраняет draft).
 * При финальном POST сервис ставит `quizCompletedAt = now()` и эмитит
 * `client.quiz.completed` через outbox для downstream listeners
 * (manager-handoff, NPS-baseline, аналитика воронки).
 *
 * Текст вопросов в UI — отдельная история (B-04.3 FE), и его финальные
 * формулировки зависят от ответа юриста по 152-ФЗ согласиям. Backend-
 * структура от этого не зависит.
 */

/**
 * Допустимые значения для diet-предпочтений. Свободные строки потому что
 * множественный выбор + возможны комбинации, не оправдывающие enum (например
 * halal + no_pork). Список фиксируется в FE-формуляре, BE валидирует длину
 * массива и допустимые значения.
 */
const ALLOWED_DIETS = [
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'no_pork',
  'no_beef',
  'no_restrictions',
] as const;

type DietPreference = (typeof ALLOWED_DIETS)[number];

export class QuizPatchDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7, { message: 'Слишком много дието-предпочтений' })
  @IsEnum(ALLOWED_DIETS, { each: true, message: 'Неизвестная диета' })
  dietPreferences?: DietPreference[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание аллергий слишком длинное' })
  allergies?: string | null;

  @IsOptional()
  @IsEnum(['slow', 'medium', 'fast'], { message: 'Темп: slow | medium | fast' })
  paceLevel?: 'slow' | 'medium' | 'fast' | null;

  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Слишком много детей в одной поездке (≤10)' })
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(17, { each: true })
  childrenAges?: number[];

  @IsOptional()
  @IsEnum(['never', 'been_once', 'multiple'], {
    message: 'Опыт: never | been_once | multiple',
  })
  indiaExperience?: 'never' | 'been_once' | 'multiple' | null;
}

/**
 * Финальный submit. Те же поля что в PATCH — мы не требуем заполнить ВСЕ
 * (quiz может закрываться частично), но ставим quizCompletedAt и эмитим event.
 *
 * Дополнительные required-валидации можно добавить позже после согласования
 * UX (например «обязательны хотя бы 3 поля»).
 */
export class QuizSubmitDto extends QuizPatchDto {}

export interface QuizResponse {
  dietPreferences: string[];
  allergies: string | null;
  paceLevel: 'slow' | 'medium' | 'fast' | null;
  hasChildren: boolean | null;
  childrenAges: number[];
  indiaExperience: 'never' | 'been_once' | 'multiple' | null;
  /** ISO timestamp когда финальный POST прошёл, либо null = только draft. */
  completedAt: string | null;
}
