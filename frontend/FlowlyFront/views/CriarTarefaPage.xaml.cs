using System;
using System.Collections.Generic;
using Microsoft.Maui.Controls;
using FlowlyFront.services;

namespace FlowlyFront.views
{
    [QueryProperty(nameof(ProjetoId), nameof(ProjetoId))]
    [QueryProperty(nameof(ProjetoNome), nameof(ProjetoNome))]
    public partial class CriarTarefaPage : ContentPage
    {
        private readonly ApiService _api = new ApiService();

        private class OptionItem
        {
            public string Text { get; }
            public string Value { get; }
            public OptionItem(string text, string value)
            {
                Text = text; Value = value;
            }
            public override string ToString() => Text;
        }

        public string ProjetoId { get; set; }
        public string ProjetoNome { get; set; }

        public CriarTarefaPage()
        {
            InitializeComponent();
        }

        protected override void OnAppearing()
        {
            base.OnAppearing();
            HeaderLabel.Text = "Criar tarefa";
            ProjetoLabel.Text = $"Projeto: {ProjetoNome}";
            PrazoPicker.MinimumDate = DateTime.Today;
            PrazoPicker.Date = DateTime.Now.AddDays(1);
            // Popular pickers com rótulos amigáveis e valores para API
            var dificuldades = new List<OptionItem>
            {
                new OptionItem("Definir", "definir"),
                new OptionItem("Fácil", "facil"),
                new OptionItem("Média", "media"),
                new OptionItem("Difícil", "dificil"),
            };
            var prioridades = new List<OptionItem>
            {
                new OptionItem("Definir", "definir"),
                new OptionItem("Alta", "alta"),
                new OptionItem("Média", "media"),
                new OptionItem("Baixa", "baixa"),
            };
            var statusList = new List<OptionItem>
            {
                new OptionItem("Pendente", "pendente"),
                new OptionItem("Em andamento", "em_andamento"),
                new OptionItem("Concluída", "concluido"),
            };

            DificuldadePicker.ItemsSource = dificuldades;
            PrioridadePicker.ItemsSource = prioridades;
            StatusPicker.ItemsSource = statusList;

            DificuldadePicker.SelectedIndex = 0;
            PrioridadePicker.SelectedIndex = 0;
            StatusPicker.SelectedIndex = 0;
            VisivelSwitch.IsToggled = true;

            // Placeholder titles (atuam como placeholders até seleção)
            DificuldadePicker.Title = "Selecione a dificuldade da tarefa..";
            PrioridadePicker.Title = "Selecione a prioridade da tarefa..";
            StatusPicker.Title = "Selecione o status..";
        }

        private async void OnSalvarClicked(object sender, EventArgs e)
        {
            var nome = NomeEntry.Text?.Trim();
            var descricao = DescricaoEditor.Text?.Trim();
            var prazo = PrazoPicker.Date;

            if (string.IsNullOrWhiteSpace(nome))
            {
                await DisplayAlert("Validação", "Informe o nome da tarefa.", "OK");
                return;
            }

            var dificuldade = (DificuldadePicker.SelectedItem as OptionItem)?.Value ?? "definir";
            var prioridade = (PrioridadePicker.SelectedItem as OptionItem)?.Value ?? "definir";
            var status = (StatusPicker.SelectedItem as OptionItem)?.Value ?? "pendente";
            var visivelAtodos = VisivelSwitch.IsToggled;

            var (success, mensagem, tarefa) = await _api.CriarTarefaAsync(
                nome, descricao, prazo, ProjetoId,
                dificuldade, prioridade, status, visivelAtodos
            );
            if (!success)
            {
                await DisplayAlert("Erro", mensagem, "OK");
                return;
            }

            await DisplayAlert("Sucesso", mensagem, "OK");
            await Shell.Current.GoToAsync("..");
        }

        private void OnPrazoSelected(object sender, DateChangedEventArgs e)
        {
            if (e.NewDate < DateTime.Today)
            {
                PrazoPicker.Date = DateTime.Today;
            }
            // Após selecionar, garantir contraste do texto
            PrazoPicker.TextColor = Color.FromArgb("#0E1F44");
        }

        private void OnDificuldadeChanged(object sender, EventArgs e)
        {
            if (DificuldadePicker.SelectedIndex >= 0)
            {
                DificuldadePicker.Title = string.Empty; // remove placeholder
                DificuldadePicker.TextColor = Color.FromArgb("#0E1F44");
            }
        }

        private void OnPrioridadeChanged(object sender, EventArgs e)
        {
            if (PrioridadePicker.SelectedIndex >= 0)
            {
                PrioridadePicker.Title = string.Empty;
                PrioridadePicker.TextColor = Color.FromArgb("#0E1F44");
            }
        }

        private void OnStatusChanged(object sender, EventArgs e)
        {
            if (StatusPicker.SelectedIndex >= 0)
            {
                StatusPicker.Title = string.Empty;
                StatusPicker.TextColor = Color.FromArgb("#0E1F44");
            }
        }
    }
}