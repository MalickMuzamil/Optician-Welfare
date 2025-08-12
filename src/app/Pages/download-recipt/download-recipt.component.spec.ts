import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadReciptComponent } from './download-recipt.component';

describe('DownloadReciptComponent', () => {
  let component: DownloadReciptComponent;
  let fixture: ComponentFixture<DownloadReciptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadReciptComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DownloadReciptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
