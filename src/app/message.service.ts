import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private snackBar: MatSnackBar) {}

  send(text: string) {
    this.snackBar.open(text, 'Fechar', {
      duration: 3000,
      panelClass: 'success-dialog',
    });
  }
}
