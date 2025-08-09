import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { AppTitleStrategy } from './title.strategy';

describe('AppTitleStrategy', () => {
  let title: Title;
  let strategy: AppTitleStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Title, AppTitleStrategy],
    });
    title = TestBed.inject(Title);
    strategy = TestBed.inject(AppTitleStrategy);
  });

  it('should prefix route title with "InstaShare —"', () => {
    const snapshot = {} as RouterStateSnapshot;
    const spy = jest.spyOn(strategy, 'buildTitle').mockReturnValue('Register');

    strategy.updateTitle(snapshot);

    expect(spy).toHaveBeenCalled();
    expect(title.getTitle()).toBe('InstaShare — Register');
  });

  it('should default to base title when no route title', () => {
    const snapshot = {} as RouterStateSnapshot;
    jest.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);

    strategy.updateTitle(snapshot);

    expect(title.getTitle()).toBe('InstaShare');
  });
});
