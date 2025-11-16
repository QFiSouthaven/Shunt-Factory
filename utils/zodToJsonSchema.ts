// utils/zodToJsonSchema.ts
// TRUST ARCHITECTURE: Zod to JSON Schema converter for Double Validation Pattern
// Manual implementation to avoid dependency conflicts with Zod v4

import { z } from 'zod';
import { Type } from '@google/genai';

/**
 * Converts a Zod schema to Gemini API JSON Schema format
 * This enables generation-time validation by passing the schema to the Gemini API
 *
 * Part of the Double Validation architecture:
 * 1. Generation-Time: This JSON Schema validates at API level
 * 2. Runtime: Original Zod schema validates the response
 */
export function zodToGeminiSchema(zodSchema: z.ZodObject<any>): any {
  const shape = zodSchema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    properties[key] = zodTypeToGeminiType(value as z.ZodTypeAny, key);

    // Check if field is required (not optional)
    if (!(value as any).isOptional()) {
      required.push(key);
    }
  }

  return {
    type: Type.OBJECT,
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function zodTypeToGeminiType(zodType: z.ZodTypeAny, description?: string): any {
  // Handle ZodString
  if (zodType instanceof z.ZodString) {
    return {
      type: Type.STRING,
      description: description || 'A string value',
    };
  }

  // Handle ZodNumber
  if (zodType instanceof z.ZodNumber) {
    return {
      type: Type.NUMBER,
      description: description || 'A number value',
    };
  }

  // Handle ZodBoolean
  if (zodType instanceof z.ZodBoolean) {
    return {
      type: Type.BOOLEAN,
      description: description || 'A boolean value',
    };
  }

  // Handle ZodArray
  if (zodType instanceof z.ZodArray) {
    const elementType = (zodType as any)._def.type;
    return {
      type: Type.ARRAY,
      items: zodTypeToGeminiType(elementType),
      description: description || 'An array',
    };
  }

  // Handle ZodObject (nested)
  if (zodType instanceof z.ZodObject) {
    return zodToGeminiSchema(zodType);
  }

  // Handle ZodOptional
  if (zodType instanceof z.ZodOptional) {
    return zodTypeToGeminiType((zodType as any)._def.innerType, description);
  }

  // Handle ZodNullable
  if (zodType instanceof z.ZodNullable) {
    return zodTypeToGeminiType((zodType as any)._def.innerType, description);
  }

  // Default fallback
  return {
    type: Type.STRING,
    description: description || 'A value',
  };
}

/**
 * Example usage:
 *
 * const mySchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   tags: z.array(z.string()).optional(),
 * });
 *
 * const geminiSchema = zodToGeminiSchema(mySchema);
 *
 * // Use in API call:
 * ai.models.generateContent({
 *   model: 'gemini-2.5-pro',
 *   contents: prompt,
 *   config: {
 *     responseMimeType: 'application/json',
 *     responseSchema: geminiSchema,
 *   }
 * });
 *
 * // Then validate with Zod at runtime:
 * const validated = mySchema.parse(response);
 */
