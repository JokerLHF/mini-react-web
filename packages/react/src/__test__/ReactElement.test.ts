import { FunctionComponent } from '@mini/react-reconciler';
import { createElement } from '../ReactElement';

describe('测试 ReactElement', () => {
	let ComponentFC: FunctionComponent;
	beforeAll(() => {
		ComponentFC = () => {
			return createElement('div', null);
		};
	});

	it('returns a complete element according to spec', () => {
		const element = createElement(ComponentFC, null);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({});
	});

	it('allows a string to be passed as the type', () => {
		const element = createElement('div', null);
		expect(element.type).toBe('div');
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({});
	});

	it('returns an immutable element', () => {
		const element = createElement(ComponentFC, null);
		expect(() => (element.type = 'div')).not.toThrow();
	});

	it('does not reuse the original config object', () => {
		const config = { foo: 1 };
		const element = createElement(ComponentFC, config);
		expect(element.props.foo).toBe(1);
		config.foo = 2;
		expect(element.props.foo).toBe(1);
	});

	it('does not fail if config has no prototype', () => {
		const config = Object.create(null, { foo: { value: 1, enumerable: true } });
		const element = createElement(ComponentFC, config);
		expect(element.props.foo).toBe(1);
	});

	it('extracts key and ref from the config', () => {
		const element = createElement(ComponentFC, {
			key: '12',
			ref: '34',
			foo: '56'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('12');
		expect(element.ref).toBe('34');
		expect(element.props).toEqual({ foo: '56' });
	});

	it('extracts null key and ref', () => {
		const element = createElement(ComponentFC, {
			key: null,
			ref: null,
			foo: '12'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('null');
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '12' });
	});

	it('ignores undefined key and ref', () => {
		const props = {
			foo: '56',
			key: undefined,
			ref: undefined
		};
		const element = createElement(ComponentFC, props);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '56' });
	});

	it('ignores key and ref warning getters', () => {
		const elementA = createElement('div', null);
		const elementB = createElement('div', elementA.props);
		expect(elementB.key).toBe(null);
		expect(elementB.ref).toBe(null);
	});

	it('coerces the key to a string', () => {
		const element = createElement(ComponentFC, {
			key: 12,
			foo: '56'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('12');
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '56' });
	});

	it('merges an additional argument onto the children prop', () => {
		const a = 1;
		const element = createElement(
			ComponentFC,
			{
				children: 'text'
			},
			a
		);
		expect(element.props.children).toBe(a);
	});

	it('does not override children if no rest args are provided', () => {
		const element = createElement(ComponentFC, {
			children: 'text'
		});
		expect(element.props.children).toBe('text');
	});

	it('overrides children if null is provided as an argument', () => {
		const element = createElement(
			ComponentFC,
			{
				children: 'text'
			},
			null
		);
		expect(element.props.children).toBe(null);
	});

	it('merges rest arguments onto the children prop in an array', () => {
		const a = 1;
		const b = 2;
		const c = 3;
		const element = createElement(ComponentFC, null, a, b, c);
		expect(element.props.children).toEqual([1, 2, 3]);
	});
});