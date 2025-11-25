using FlowlyFront.views;

namespace FlowlyFront
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();

            Routing.RegisterRoute(nameof(LoginPage), typeof(LoginPage));
            Routing.RegisterRoute(nameof(RegisterPage), typeof(RegisterPage));
            // Dashboard removida
            Routing.RegisterRoute(nameof(EquipesPage), typeof(EquipesPage));
            Routing.RegisterRoute(nameof(MinhasEquipesPage), typeof(MinhasEquipesPage));
            Routing.RegisterRoute(nameof(CriarEquipePage), typeof(CriarEquipePage));
            Routing.RegisterRoute(nameof(ProjetosPage), typeof(ProjetosPage));
            Routing.RegisterRoute(nameof(CriarProjetoPage), typeof(CriarProjetoPage));
            Routing.RegisterRoute(nameof(ProjetoDetalhesPage), typeof(ProjetoDetalhesPage));
            Routing.RegisterRoute(nameof(CriarTarefaPage), typeof(CriarTarefaPage));
            Routing.RegisterRoute(nameof(TarefaDetalhesPage), typeof(TarefaDetalhesPage));
            Routing.RegisterRoute(nameof(AccountPage), typeof(FlowlyFront.views.AccountPage));
            Routing.RegisterRoute(nameof(MeusDadosPage), typeof(MeusDadosPage));
            Routing.RegisterRoute(nameof(VerificarUsuario), typeof(VerificarUsuario));
        }
    }
}
