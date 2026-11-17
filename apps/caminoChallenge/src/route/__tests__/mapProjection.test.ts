import { describe, expect, it } from 'vitest';

import {
    createProjection,
    pointOnRoute,
    smoothRoutePath,
    walkedRoutePath,
} from '@/route/mapProjection';

describe('createProjection', () => {
    const bounds = { west: -3, east: -1, south: 42, north: 43 };

    it('maps the bounds to the corners, west left and north on top', () => {
        const map = createProjection(bounds, 200);
        expect(map.project(43, -3)).toEqual({ x: 0, y: 0 });
        const southEast = map.project(42, -1);
        expect(southEast.x).toBeCloseTo(200);
        expect(southEast.y).toBeCloseTo(map.height);
    });

    it('shrinks longitude by latitude so the map keeps its shape', () => {
        const map = createProjection(bounds, 200);
        // 2 degrees of longitude at 42.5° N are about 1.47 degrees of latitude wide.
        expect(200 / map.height).toBeCloseTo(2 * Math.cos((42.5 * Math.PI) / 180), 5);
    });

    it('stretches north-south distances on request', () => {
        expect(createProjection(bounds, 200, 2).height).toBeCloseTo(
            createProjection(bounds, 200).height * 2,
        );
    });
});

describe('smooth route', () => {
    const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 10 },
    ];

    it('passes through every point', () => {
        expect(pointOnRoute(points, 0, 0)).toEqual(points[0]);
        expect(pointOnRoute(points, 1, 0)).toEqual(points[1]);
        expect(pointOnRoute(points, 2, 0.5)).toEqual(points[2]);
        const almostThere = pointOnRoute(points, 1, 0.999);
        expect(almostThere.x).toBeCloseTo(20, 1);
        expect(almostThere.y).toBeCloseTo(10, 1);
    });

    it('lies between neighbouring points halfway along a leg', () => {
        const middle = pointOnRoute(points, 0, 0.5);
        expect(middle.x).toBeGreaterThan(0);
        expect(middle.x).toBeLessThan(10);
    });

    it('draws one curve per leg and ends the walked path at the pilgrim', () => {
        expect(smoothRoutePath(points).match(/C/g)).toHaveLength(2);
        expect(walkedRoutePath(points, 0, 0)).toBe('M 0.0,0.0');

        const walked = walkedRoutePath(points, 1, 0.5);
        expect(walked.match(/C/g)).toHaveLength(2);
        const pilgrim = pointOnRoute(points, 1, 0.5);
        expect(walked.endsWith(`${pilgrim.x.toFixed(1)},${pilgrim.y.toFixed(1)}`)).toBe(true);
    });
});
