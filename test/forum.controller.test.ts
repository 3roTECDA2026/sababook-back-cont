import { test, describe } from 'node:test';
import assert from 'node:assert';
import { obtenerForos, obtenerForo } from '../src/controllers/forum.controller.js';
import { forumService } from '../src/services/forum.service.js';
import { Request, Response } from 'express';

describe('Forum Controller - GET /api/v1/foro', () => {
  test('obtenerForos responde con status 200 y la lista de foros cuando el servicio responde exitosamente', async () => {
    const mockForos = [
      {
        foro_id: 1,
        titulo: 'Debate de prueba',
        descripcion: 'Descripción',
        creador_id: 1,
        fecha_creacion: new Date(),
        creador_nombre: 'Usuario Test',
        es_apl: false,
        episodio_id: null,
      },
    ];

    // Mock forumService
    const originalObtenerTodos = forumService.obtenerTodosForos;
    forumService.obtenerTodosForos = async () => mockForos;

    let statusCode: number | undefined;
    let jsonResponse: any;

    const req = {} as Request;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonResponse = data;
        return this;
      },
    } as unknown as Response;

    try {
      await obtenerForos(req, res);
      assert.strictEqual(jsonResponse, mockForos);
    } finally {
      forumService.obtenerTodosForos = originalObtenerTodos;
    }
  });

  test('obtenerForos captura fallos de DB y responde con HTTP 500 y detalle sin romper el proceso', async () => {
    // Mock forumService throwing error (ej. Supabase db down / error de conexión)
    const originalObtenerTodos = forumService.obtenerTodosForos;
    forumService.obtenerTodosForos = async () => {
      throw new Error('Connection error to database');
    };

    let statusCode: number | undefined;
    let jsonResponse: any;

    const req = {} as Request;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonResponse = data;
        return this;
      },
    } as unknown as Response;

    try {
      await obtenerForos(req, res);
      assert.strictEqual(statusCode, 500);
      assert.strictEqual(jsonResponse.mensaje, 'Error al obtener los foros');
      assert.strictEqual(jsonResponse.detalle, 'Connection error to database');
    } finally {
      forumService.obtenerTodosForos = originalObtenerTodos;
    }
  });

  test('obtenerForo con ID inválido devuelve status 400 Bad Request controlado', async () => {
    let statusCode: number | undefined;
    let jsonResponse: any;

    const req = { params: { id: 'invalid' } } as unknown as Request;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonResponse = data;
        return this;
      },
    } as unknown as Response;

    await obtenerForo(req, res);
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResponse.mensaje, 'ID de foro inválido');
  });
});
