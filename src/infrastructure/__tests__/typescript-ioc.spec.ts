import { Container, Inject, InRequestScope, Scope, Scoped } from 'typescript-ioc';

abstract class Counter{
	private static _global = 0;
	private _counter: number;
	constructor(){
		this._counter = ++Counter._global;
	}

	public get counter(): number {
		return this._counter;
	}
}

@InRequestScope
class ClassC extends Counter {

}

@Scoped(Scope.Local)
class ClassB extends Counter {
	@Inject classC: ClassC;
}

@InRequestScope
class ClassA extends Counter {
	@Inject
	public classB: ClassB;
	@Inject
	public classB2: ClassB;
	@Inject
	public classC: ClassC;
	@Inject
	public classC2: ClassC;
}


describe('typescript ioc tests', () => {
	it('should get correct scopes', async () => {
		const classA = Container.get(ClassA);

		expect(classA.classB.counter).not.toEqual(classA.classB2.counter);
		expect(classA.classC.counter).toEqual(classA.classC2.counter);
		expect(classA.classC.counter).toEqual(classA.classB.classC.counter);
		expect(classA.classC.counter).toEqual(classA.classB2.classC.counter);
	});
});

