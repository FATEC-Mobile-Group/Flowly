using System;
using Microsoft.Maui.Controls;

namespace FlowlyFront.converters
{
    public class StatusToFriendlyConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            var raw = value as string ?? string.Empty;
            return raw switch
            {
                "pendente" => "Pendente",
                "em_andamento" => "Em andamento",
                "concluido" => "Concluída",
                _ => raw
            };
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            var friendly = value as string ?? string.Empty;
            return friendly.ToLowerInvariant() switch
            {
                "pendente" => "pendente",
                "em andamento" => "em_andamento",
                "concluída" => "concluido",
                "concluido" => "concluido",
                _ => friendly
            };
        }
    }
}