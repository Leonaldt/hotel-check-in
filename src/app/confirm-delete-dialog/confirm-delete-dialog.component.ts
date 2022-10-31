import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-dialog',
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrls: ['./confirm-delete-dialog.component.scss'],
})
export class ConfirmDeleteDialogComponent implements OnInit {
  title: string;
  message: string;

  @ViewChild('emailInput') onConfirmInputElement!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,

    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteDialog
  ) {
    this.title = 'Excluir Registro';
    this.message = 'Você tem certeza que deseja fazer isso?';
  }

  ngOnInit() {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    this.dialogRef.close(false);
  }
}

export class ConfirmDeleteDialog {
  constructor() {}
}
