@files = (
          {file=> "./src/js/simpleTable.js", task=>"concat",output=>"js/conquerworld.js"},
          {file=> "./src/js/game.js", task=>"concat",output=>"js/conquerworld.js"},
          {file=> "./src/js/game.util.js", task=>"concat",output=>"js/conquerworld.js"},
          {file=> "./src/js/remoteDatabase.js", task=>"concat",output=>"js/conquerworld.js",fix =>"updateWorker"},
          {file=> "./src/js/database.js", task=>"concat",output=>"js/conquerworld.js"},
          {file=> "./src/js/game.drawLayer.js", task=>"concat",output=>"js/conquerworld.js"},
          {file=> "./src/js/game.splash.js", task=>"concat",output=>"js/conquerworld.js"},
          {file=> "./src/js/game.model.js", task=>"concat", output=>"js/conquerworld.js"},
          {file=> "./src/js/lib/radio.min.js", task=>"copy"},
          {file=> "./src/js/lib/hex.js", task=>"copy"},
          {file=> "./src/js/updateWorker.js", task=>"version",fix=>'js/game.util'},
          {file=> "./src/js/game.util.js" , task=>"version"},
          {file=> "./src/css/DarkGenerals.css", task=>"copy"},
          {file=> "./src/defeat.jpg", task=>"copy"},
          {file=> "./src/play.jpg", task=>"copy"},
          {file=> "./src/splash.jpg", task=>"copy"},
          {file=> "./src/index.html", task=>"fix", fix=>"js/conquestworld"},
         );

$dest = "/public/";
system("mkdir" ,".\\public");
system("mkdir",".\\public\\js");
system("mkdir",".\\public\\js\\lib");
system("mkdir",".\\public\\css");

open($v,"<","version.txt");
@v=<$v>;
chomp($v[0]);
chomp($v[1]);
chomp($v[2]);
if($ARGV[0] eq "incmajor"){
  $v[0] = $v[0]+1;
}
if($ARGV[0] eq "incminor"){
  $v[1] = $v[1]+1;
}
if($ARGV[0] eq "incdaily"){
  $v[2] = $v[2]+1;
}

close($v);
open($v,">","version.txt");
print $v $v[0],"\n",$v[1],"\n",$v[2],"\n";
close($v);
$version = ".".$v[0].".".$v[1].".".$v[2];
$bundle ="./public/js/conquestworld".$version.".js";
print $bundle,"\n";
open($output,">", $bundle) || die "could not open output file conquerworld.js";

foreach my $t (@files){
  if ($t->{task} eq "concat"){
    open($in,"<",$t->{file}) || die "could not open file", $t->{file};
      if($t->{fix}){
        $replace = $t->{fix}.$version;
      }
    
    while(<$in>){
      if($t->{fix}){
        s/$t->{fix}/$replace/;
      }
      print $output $_;
    }
    close($in);
  }elsif($t->{task} eq 'copy'){
    $dest = $t->{file};
    $dest =~s/src/public/;
    $dest =~s/\//\\/g;
    print $dest,"\n";
    $src = $t->{file};
    $src =~s/\//\\/g;
    
    system("copy",$src ,$dest);
  }elsif($t->{task} eq "version"){
    $f = $t->{file};
    $f =~s/\.js/$version/;
    $f=$f.".js";
    $src = $t->{file};
    $src =~s/\//\\/g;
    $f =~s/\//\\/g;
    $f=~s/src/public/;
    print "version  ",$t->{file}," to ", $f,"\n";
    open( my $fname,"<",$src);
    open (my $ofname,">",$f);
      if($t->{fix}){
        $replace = $t->{fix}.$version;
      }
    
    while(<$fname>){
      if($t->{fix}){
        s/$t->{fix}/$replace/;
      }
      print $ofname $_;
    }
    close($fname);
    close($ofname);
  }elsif($t->{task} eq 'fix'){
       $f = $t->{file};
    $src = $t->{file};
    $src =~s/\//\\/g;
    $f =~s/\//\\/g;
    $f=~s/src/public/;
    print "fix  ",$t->{file}," to ", $f,"\n";
    open( my $fname,"<",$src);
    open (my $ofname,">",$f);
      if($t->{fix}){
        $replace = $t->{fix}.$version;
      }
    
    while(<$fname>){
      if($t->{fix}){
        s/$t->{fix}/$replace/;
      }
      print $ofname $_;
    }
    close($fname);
    close($ofname); 
  }
  
}


close($output);
