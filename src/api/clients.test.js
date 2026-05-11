import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { fetchClients, createClient } from '../../api/clients.api';

const server = setupServer(
  rest.get('http://localhost:8000/api/clients', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: [
        { id: 1, first_name: 'John', email: 'john@example.com', status: 'active' },
        { id: 2, first_name: 'Jane', email: 'jane@example.com', status: 'active' },
      ],
    }));
  }),
  rest.post('http://localhost:8000/api/clients', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({
      success: true,
      data: { id: 3, first_name: 'Bob', email: 'bob@example.com' },
    }));
  })
);

beforeEach(() => server.listen());
afterEach(() => server.closeAllHandlers());

describe('Clients API', () => {
  it('should fetch all clients', async () => {
    const data = await fetchClients();
    expect(data).toHaveLength(2);
    expect(data[0].email).toBe('john@example.com');
  });

  it('should create a new client', async () => {
    const newClient = {
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob@example.com',
      phone: '0791234567',
    };
    const result = await createClient(newClient);
    expect(result.id).toBe(3);
    expect(result.email).toBe('bob@example.com');
  });
});
