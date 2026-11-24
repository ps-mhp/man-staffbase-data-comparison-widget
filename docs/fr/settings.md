# Paramètres

## Dimensions (à droite, onglet « Dimensions »)

| Paramètre | Description |
| --- | --- |
| Nom | Apparaît dans la première colonne. Obligatoire. |
| Type | **Texte** (texte libre, les sauts de ligne sont conservés), **Nombre** (avec unité, valeur maximale si souhaité), **Oui/Non** (case à cocher ou croix), **Liste** (une entrée par ligne, sous forme de liste à puces), **Sélection** (une valeur parmi des options prédéfinies), **Évaluation** (1 à 5 étoiles), **Galerie** (images à faire défiler et à agrandir, ne compare rien). Par défaut : Texte. |
| Explication | Facultatif, s'affiche en petits caractères sous le nom. |
| Unités | Uniquement pour les nombres. Une ou plusieurs unités, par exemple « PS » et « kW » ; l'unité suit chaque nombre. En cas de plusieurs unités, chaque élément dispose de son propre champ par unité, et une ligne est consacrée à chaque unité sur la page. La meilleure valeur compare la première unité. |
| Meilleure valeur | Uniquement pour les nombres : **Neutre** (aucun marquage), **Plus c'est élevé, mieux c'est** ou **Plus c'est bas, mieux c'est**. Par défaut : Neutre. Les évaluations sont toujours considérées comme « plus c'est élevé, mieux c'est ». |
| Options | Uniquement pour les sélections. Les valeurs parmi lesquelles chaque élément en choisit une. Au moins une. |
| Icône devant le nom | Facultatif, une icône issue de la bibliothèque d’icônes devant le nom de la dimension. |
| Symbole pour Oui / Non | Uniquement pour Oui/Non. Icône issue de la bibliothèque d’icônes ; par défaut : une coche et une croix. |
| Couleur pour Oui / Non | Uniquement pour Oui/Non. Une couleur MAN-CI, d’état ou personnalisée ; par défaut : couleur d’accent pour Oui et gris pour Non. La couleur sélectionnée reste inchangée même dans les lignes grises. |
| Taille des symboles | Uniquement pour Oui/Non. **Petit** (8 × 8 px), **Normal** (10 × 10 px) ou **Grand** (12 × 12 px). Par défaut : Normal. |

Sous chaque dimension déployée : déplacer vers le haut/bas, **dupliquer** (la copie reprend le type, les paramètres et toutes les valeurs, et s'affiche juste derrière) et supprimer.

## Éléments (à gauche et au centre)

| Paramètre | Description |
| --- | --- |
| Nom | Apparaît au-dessus de la colonne. Obligatoire. |
| Sous-titre | Facultatif, une ligne sous le nom. |
| Valeurs | Un champ par dimension, adapté au type. Un champ vide signifie « aucune valeur » et s'affiche sous la forme « – ». Sur la page, les valeurs sont centrées dans leur colonne. |

Il peut y avoir autant d’éléments et de dimensions que souhaité, avec un maximum de 20 images par galerie. Les images d’une galerie ne sont jamais recadrées : la hauteur de la ligne de la galerie dépend de la plus haute image parmi tous les éléments.

## Mise en page (à droite, onglet « Mise en page »)

| Paramètre | Description |
| --- | --- |
| Titre | Facultatif, s'affiche au-dessus du tableau. |
| Accent | **Rouge**, **anthracite** ou **bleu** – couleur des coches, étoiles, icônes et meilleures valeurs. Par défaut : rouge. |
| Transposer | Inverse le tableau : les éléments deviennent des lignes (nom à gauche, reste fixe lors du défilement), les dimensions deviennent des colonnes. Les options « Masquer », « Meilleures valeurs », « Différences uniquement » et « Lignes visibles » restent actives – les éléments sont alors repliés. Par défaut : désactivé. |
| Masquer les valeurs identiques | Les dimensions dans lesquelles tous les éléments ont la même valeur apparaissent en gris. « Sans indication » compte comme une valeur à part entière. Les galeries ne sont jamais masquées. Par défaut : activé. |
| Mettre en évidence les meilleures valeurs | Met en évidence la meilleure valeur pour les nombres classés par ordre de préférence et pour les évaluations. Si tous les éléments ont la même valeur, rien n’est mis en évidence. Par défaut : activé. |

## Comportement (à droite, onglet « Comportement »)

| Paramètre | Description |
| --- | --- |
| Lignes visibles | Nombre de lignes (dimensions) affichées ; le reste est masqué derrière le bouton « Afficher plus de… lignes ». **0** affiche toutes les lignes. Par défaut : 5. |
| Bouton « Différences uniquement » | Affiche au-dessus du tableau un bouton permettant de masquer les lignes sans différence. Le choix n’est pas enregistré. Par défaut : désactivé. |
